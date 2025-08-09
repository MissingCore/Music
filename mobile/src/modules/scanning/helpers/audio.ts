import {
  MetadataPresets,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import { eq, inArray, lt, sql } from "drizzle-orm";
import { toSnakeCase } from "drizzle-orm/casing";
import { File } from "expo-file-system/next";
import type { Asset as MediaLibraryAsset } from "expo-media-library";
import { getAssetsAsync } from "expo-media-library";

import { db } from "~/db";
import type { InvalidTrack } from "~/db/schema";
import {
  albums,
  artists,
  invalidTracks,
  playedMediaLists,
  tracks,
} from "~/db/schema";

import { RECENT_RANGE_MS } from "~/api/recent";
import { deleteTrack } from "~/api/track";
import { userPreferencesStore } from "~/services/UserPreferences";
import { Queue, musicStore } from "~/modules/media/services/Music";
import { onboardingStore } from "../services/Onboarding";

import { withColumns } from "~/lib/drizzle";
import { Stopwatch } from "~/utils/debug";
import { chunkArray, omitKeys } from "~/utils/object";
import { BATCH_PRESETS, batch, wait } from "~/utils/promise";
import {
  addTrailingSlash,
  getSafeUri,
  removeFileExtension,
} from "~/utils/string";
import type { ExtractFnReturnType } from "~/utils/types";
import { savePathComponents } from "./folder";

/** Return references to tracks that fit our criteria. */
async function discoverTracks() {
  const {
    listAllow: _listAllow,
    listBlock: _listBlock,
    minSeconds,
  } = userPreferencesStore.getState();
  const listAllow = _listAllow.map((p) => `file://${addTrailingSlash(p)}`);
  const listBlock = _listBlock.map((p) => `file://${addTrailingSlash(p)}`);

  // Get all audio files discoverable by `expo-media-library`.
  const incomingData: MediaLibraryAsset[] = [];
  let isComplete = false;
  let lastRead: string | undefined;
  do {
    const { assets, endCursor, hasNextPage } = await getAssetsAsync({
      after: lastRead,
      first: BATCH_PRESETS.LIGHT,
      mediaType: "audio",
    });
    incomingData.push(...assets);
    lastRead = endCursor;
    isComplete = !hasNextPage;
  } while (!isComplete);

  const validTracks = incomingData.filter(
    (a) =>
      // Ensure track is in the allowlist if it's non-empty.
      (listAllow.length === 0 || listAllow.some((p) => a.uri.startsWith(p))) &&
      // Ensure track isn't in the blocklist.
      !listBlock.some((p) => a.uri.startsWith(p)) &&
      // Ensure track meets the minimum duration requirement.
      a.duration > minSeconds,
  );

  return { _all: incomingData, valid: validTracks };
}

/** Figure out whether we have new or modified tracks. */
async function getLibraryModifications(assets: MediaLibraryAsset[]) {
  const savedTracks = await db.query.tracks.findMany({
    columns: withColumns(["id", "modificationTime", "uri", "editedMetadata"]),
  });
  const erroredTracks = await db.query.invalidTracks.findMany();
  // Format data as objects for faster reads inside a loop.
  const savedMap = Object.fromEntries(savedTracks.map((t) => [t.id, t]));
  const erroredMap = Object.fromEntries(erroredTracks.map((t) => [t.id, t]));

  // Find the tracks we can skip indexing or need updating.
  const modified = new Set<string>();
  const unmodified = new Set<string>();
  assets.forEach(({ id, modificationTime, uri }) => {
    const isSaved = savedMap[id];
    const isInvalid = erroredMap[id];
    if (!isSaved && !isInvalid) return; // If we have a new track.

    const lastModified = (isSaved ?? isInvalid)!.modificationTime;
    const hasEdited = typeof isSaved?.editedMetadata === "number";
    let isDifferentUri = (isSaved ?? isInvalid)!.uri !== uri;

    // Moving folders in Android is kind of weird; sometimes, the URI of
    // the file after being moved is still being displayed in its original
    // location in addition to its new location.
    //
    // The logic below makes sure that if the file has the same id and is
    // detected in 2 different locations, we make sure the track is marked
    // as being "modified".
    if (isDifferentUri && unmodified.has(id)) unmodified.delete(id);
    else if (!isDifferentUri && modified.has(id)) isDifferentUri = true;

    // Retry indexing if modification time or uri is different.
    if ((!hasEdited && modificationTime !== lastModified) || isDifferentUri) {
      modified.add(id);
    } else {
      unmodified.add(id);
    }
  });

  return {
    stats: {
      prevSaved: savedTracks.length,
      unstaged: assets.length - unmodified.size,
    },
    unstagedTracks: assets.filter(({ id }) => !unmodified.has(id)),
  };
}

const wantedMetadata = [
  ...MetadataPresets.standard,
  ...["discNumber", "bitrate", "sampleMimeType", "sampleRate"],
] as const;

type TrackMetadata = ExtractFnReturnType<typeof getTrackMetadata>;

/**
 * Get the metadata associated with a track.
 *
 * **Note:** We return `album`, which is non-standard and should be used
 * to create an Album and then swapped out with the created `albumId`.
 */
async function getTrackMetadata(asset: MediaLibraryAsset) {
  const { id, uri, duration, modificationTime, filename } = asset;
  const { bitrate, sampleRate, ...t } = await getMetadata(uri, wantedMetadata);
  const file = new File(getSafeUri(uri));

  let newAlbum: { name: string; artistName: string } | undefined;
  if (!!t.albumTitle?.trim() && !!t.albumArtist?.trim()) {
    newAlbum = { name: t.albumTitle.trim(), artistName: t.albumArtist.trim() };
  }

  return {
    id,
    name: t.title?.trim() || removeFileExtension(filename),
    artistName: t.artist?.trim() || null,
    album: newAlbum,
    track: t.trackNumber,
    disc: t.discNumber,
    year: t.year,
    format: t.sampleMimeType,
    bitrate,
    sampleRate,
    duration,
    uri,
    modificationTime,
    fetchedArt: false,
    size: file.exists ? (file.size ?? 0) : 0,
  };
}

//#region Saving Function
/** Index tracks with their metadata into our database. */
export async function findAndSaveAudio() {
  const stopwatch = new Stopwatch();

  // Reset tracked values when saving/updating tracks in onboarding store.
  onboardingStore.setState({ staged: 0, saveErrors: 0 });

  const { _all: foundAssets, valid: discoveredTracks } = await discoverTracks();
  console.log(
    `Found ${foundAssets.length} tracks, filtered down to ${discoveredTracks.length} in ${stopwatch.lapTime()}.`,
  );

  const { stats, unstagedTracks } =
    await getLibraryModifications(discoveredTracks);
  onboardingStore.setState(stats);
  console.log(`Determined unstaged content in ${stopwatch.lapTime()}.`);

  // Set the current phase to `tracks` if we find tracks that need saving/updating.
  if (unstagedTracks.length > 0) onboardingStore.setState({ phase: "tracks" });
  await wait(1); // Slight buffer to prevent blocking onboarding screen animation.

  const rawTrackEntries: TrackMetadata[] = [];
  const erroredTracks: InvalidTrack[] = [];
  await batch({
    data: unstagedTracks,
    batchAmount: BATCH_PRESETS.PROGRESS,
    callback: async (mediaAsset) => {
      const { id, uri, modificationTime } = mediaAsset;

      try {
        const trackEntry = await getTrackMetadata(mediaAsset);
        rawTrackEntries.push(trackEntry);
      } catch (err) {
        const isError = err instanceof Error;
        const errorInfo = {
          errorName: isError ? err.name : "UnknownError",
          errorMessage: isError ? err.message : "Rejected for unknown reasons.",
        };
        // We may end up here if the track at the given uri doesn't exist anymore.
        console.log(`[Track ${id}] ${errorInfo.errorMessage}`);

        erroredTracks.push({ id, uri, modificationTime, ...errorInfo });
        throw new Error(id);
      }
    },
    onBatchComplete: (fulfilled, rejected) => {
      onboardingStore.setState((prev) => ({
        staged: prev.staged + fulfilled.length,
        saveErrors: prev.saveErrors + rejected.length,
      }));
    },
  });

  const newArtists = new Set<string>();
  const albumMap: Record<string, Set<string>> = {};
  rawTrackEntries.forEach(({ artistName, album }) => {
    if (artistName) newArtists.add(artistName);
    if (album) {
      const { name, artistName } = album;
      newArtists.add(artistName);
      if (!albumMap[artistName]?.has(name)) {
        if (albumMap[artistName]) albumMap[artistName].add(name);
        else albumMap[artistName] = new Set([name]);
      }
    }
  });

  if (newArtists.size > 0) {
    await db
      .insert(artists)
      .values([...newArtists].map((name) => ({ name })))
      .onConflictDoNothing();
  }
  const albumIdMap: Record<string, Record<string, string>> = {};
  if (Object.keys(albumMap).length > 0) {
    const createdAlbums = await db
      .insert(albums)
      .values(
        Object.entries(albumMap).flatMap(([artistName, names]) =>
          [...names].map((name) => ({ name, artistName })),
        ),
      )
      .onConflictDoUpdate({
        target: [albums.name, albums.artistName, albums.releaseYear],
        // Set `name` to the `name` from the row that wasn't inserted. This
        // allows `.returning()` to return a value.
        set: { name: sql`excluded.name` },
      })
      .returning({
        id: albums.id,
        name: albums.name,
        artistName: albums.artistName,
      });
    createdAlbums.map(({ id, name, artistName }) => {
      if (albumIdMap[artistName]) albumIdMap[artistName][name] = id;
      else albumIdMap[artistName] = { [name]: id };
    });
  }

  if (rawTrackEntries.length > 0) {
    await savePathComponents(rawTrackEntries.map(({ uri }) => uri));
  }

  const formattedTrackEntries = rawTrackEntries.map(({ album, ...t }) => ({
    ...t,
    albumId: album ? albumIdMap[album.artistName]?.[album.name] || null : null,
    discoverTime: Date.now(),
  }));
  if (formattedTrackEntries.length > 0) {
    const trackBatches = chunkArray(formattedTrackEntries, 1000);
    const setTrackUpsert = Object.fromEntries(
      Object.keys(omitKeys(formattedTrackEntries[0]!, ["id", "discoverTime"]))
        // For some reason, `tracks[key].name` isn't in snake_case, which would
        // cause the `excluded` to fail.
        .map((k) => [k, sql.raw(`excluded.${toSnakeCase(k)}`)]),
    );
    for (const tBatch of trackBatches) {
      await db.insert(tracks).values(tBatch).onConflictDoUpdate({
        target: tracks.id,
        set: setTrackUpsert,
      });
      await db.delete(invalidTracks).where(
        inArray(
          invalidTracks.id,
          tBatch.map(({ id }) => id),
        ),
      );
    }
  }

  if (erroredTracks.length > 0) {
    const setInvalidTracksUpsert = Object.fromEntries(
      Object.keys(omitKeys(erroredTracks[0]!, ["id"])).map((k) => [
        k,
        sql.raw(`excluded.${toSnakeCase(k)}`),
      ]),
    );
    await db.delete(tracks).where(
      inArray(
        tracks.id,
        erroredTracks.map(({ id }) => id),
      ),
    );
    await db.insert(invalidTracks).values(erroredTracks).onConflictDoUpdate({
      target: invalidTracks.id,
      set: setInvalidTracksUpsert,
    });
  }

  const { staged, saveErrors } = onboardingStore.getState();
  console.log(
    `Found/updated ${staged} tracks & encountered ${saveErrors} errors in ${stopwatch.lapTime()}.`,
  );
  console.log(`Completed finding & saving audio in ${stopwatch.stop()}`);

  return {
    foundFiles: discoveredTracks,
    unstagedFiles: unstagedTracks,
    changed: stats.unstaged,
  };
}
//#endregion

//#region Cleanup Functions
/** Clean up all unused content from a validated list of found content. */
export async function cleanupDatabase(usedTrackIds: string[]) {
  // Remove any unused tracks.
  const unusedTrackIds = (
    await Promise.all(
      [invalidTracks, tracks].map((sch) => db.select({ id: sch.id }).from(sch)),
    )
  )
    .flat()
    .map(({ id }) => id)
    .filter((id) => !usedTrackIds.includes(id));
  await batch({
    data: unusedTrackIds,
    callback: async (id) => {
      await db.delete(invalidTracks).where(eq(invalidTracks.id, id));
      await deleteTrack(id);
    },
  });

  // Ensure we didn't reference deleted tracks in the playback store.
  const { playingList, activeId } = musicStore.getState();
  const currList = activeId ? playingList.concat(activeId) : playingList;
  const hasRemovedTrack = currList.some((tId) => unusedTrackIds.includes(tId));
  if (hasRemovedTrack) await musicStore.getState().reset();
  // Clear the queue of deleted tracks.
  await Queue.removeIds(unusedTrackIds);

  // Remove recently played media that's beyond what we display.
  await db
    .delete(playedMediaLists)
    .where(lt(playedMediaLists.lastPlayedAt, Date.now() - RECENT_RANGE_MS));

  // Remove anything else that's unused.
  await removeUnusedCategories();
}

/** Remove any albums or artists that aren't used. */
export async function removeUnusedCategories() {
  // Remove unused albums.
  const allAlbums = await db.query.albums.findMany({
    columns: { id: true },
    with: { tracks: { columns: { id: true } } },
  });
  const unusedAlbumIds = allAlbums
    .filter(({ tracks }) => tracks.length === 0)
    .map(({ id }) => id);
  await db.delete(albums).where(inArray(albums.id, unusedAlbumIds));

  // Remove unused artists.
  const allArtists = await db.query.artists.findMany({
    columns: { name: true },
    with: {
      albums: { columns: { id: true } },
      tracks: { columns: { id: true } },
    },
  });
  const unusedArtistNames = allArtists
    .filter(({ albums, tracks }) => albums.length === 0 && tracks.length === 0)
    .map(({ name }) => name);
  await db.delete(artists).where(inArray(artists.name, unusedArtistNames));
}
//#endregion
