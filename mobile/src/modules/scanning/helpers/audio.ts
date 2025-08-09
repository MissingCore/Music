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

import { upsertAlbum } from "~/api/album";
import { createArtist } from "~/api/artist";
import { RECENT_RANGE_MS } from "~/api/recent";
import { getSaveErrors } from "~/api/setting";
import { createTrack, deleteTrack, getTracks, updateTrack } from "~/api/track";
import { userPreferencesStore } from "~/services/UserPreferences";
import { Queue, musicStore } from "~/modules/media/services/Music";
import { onboardingStore } from "../services/Onboarding";

import {
  addTrailingSlash,
  getSafeUri,
  removeFileExtension,
} from "~/utils/string";
import { Stopwatch } from "~/utils/debug";
import { chunkArray, omitKeys } from "~/utils/object";
import { BATCH_PRESETS, batch, wait } from "~/utils/promise";
import { savePathComponents } from "./folder";

//#region Saving Function
/** Index tracks with their metadata into our database. */
export async function findAndSaveAudio() {
  const stopwatch = new Stopwatch();

  // Reset tracked values when saving/updating tracks in onboarding store.
  onboardingStore.setState({ staged: 0, saveErrors: 0 });

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
  // Filter through the audio files and keep the tracks we want (in allowlist,
  // not in blocklist, and meets the minimum duration requirements).
  const discoveredTracks = incomingData.filter(
    (a) =>
      // If allowlist is empty, we want the check to resolve to `true`.
      (listAllow.length === 0 || listAllow.some((p) => a.uri.startsWith(p))) &&
      !listBlock.some((p) => a.uri.startsWith(p)) &&
      a.duration > minSeconds,
  );
  console.log(
    `Found ${incomingData.length} tracks, filtered down to ${discoveredTracks.length} in ${stopwatch.lapTime()}.`,
  );

  // Get relevant entries inside our database.
  const allTracks = await getTracks({
    columns: ["id", "modificationTime", "uri", "editedMetadata"],
    withAlbum: false,
    withHidden: true,
  });
  const allTracksMap = Object.fromEntries(allTracks.map((t) => [t.id, t]));
  const allInvalidTracks = await getSaveErrors();
  const allInvalidTracksMap = Object.fromEntries(
    allInvalidTracks.map((t) => [t.id, t]),
  );
  onboardingStore.setState({ prevSaved: allTracks.length });

  // Find the tracks we can skip indexing or need updating.
  const modifiedTracks = new Set<string>();
  const unmodifiedTracks = new Set<string>();
  discoveredTracks.forEach(({ id, modificationTime, uri }) => {
    const isSaved = allTracksMap[id];
    const isInvalid = allInvalidTracksMap[id];
    if (!isSaved && !isInvalid) return; // If we have a new track.

    const lastModified = (isSaved ?? isInvalid)!.modificationTime;
    const hasEdited =
      isSaved?.editedMetadata !== undefined
        ? isSaved.editedMetadata !== null
        : false;
    let isDifferentUri = (isSaved ?? isInvalid)!.uri !== uri;

    // Moving folders in Android is kind of weird; sometimes, the URI of
    // the file after being moved is still being displayed in its original
    // location in addition to its new location.
    //
    // The logic below makes sure that if the file has the same id and is
    // detected in 2 different locations, we make sure the track is marked
    // as being "modified".
    if (isDifferentUri && unmodifiedTracks.has(id)) unmodifiedTracks.delete(id);
    else if (!isDifferentUri && modifiedTracks.has(id)) isDifferentUri = true;

    // Retry indexing if modification time or uri is different.
    if ((!hasEdited && modificationTime !== lastModified) || isDifferentUri) {
      modifiedTracks.add(id);
    } else {
      unmodifiedTracks.add(id);
    }
  });
  onboardingStore.setState({
    unstaged: discoveredTracks.length - unmodifiedTracks.size,
  });
  console.log(`Determined unstaged content in ${stopwatch.lapTime()}.`);

  // Create track entries from the minimum amount of data.
  const unstagedTracks = discoveredTracks.filter(
    ({ id }) => !unmodifiedTracks.has(id),
  );
  // Set the current phase to `tracks` if we find tracks that need saving/updating.
  if (unstagedTracks.length > 0) onboardingStore.setState({ phase: "tracks" });
  await wait(1); // Slight buffer to prevent blocking onboarding screen animation.
  const rawTrackEntries: Array<Awaited<ReturnType<typeof getTrackEntry>>> = [];
  const erroredTracks: InvalidTrack[] = [];
  await batch({
    data: unstagedTracks,
    batchAmount: BATCH_PRESETS.PROGRESS,
    callback: async (mediaAsset) => {
      const { id, uri, modificationTime } = mediaAsset;

      try {
        const trackEntry = await getTrackEntry(mediaAsset);
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

  await db
    .insert(artists)
    .values([...newArtists].map((name) => ({ name })))
    .onConflictDoNothing();
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
  const albumIdMap: Record<string, Record<string, string>> = {};
  createdAlbums.map(({ id, name, artistName }) => {
    if (albumIdMap[artistName]) albumIdMap[artistName][name] = id;
    else albumIdMap[artistName] = { [name]: id };
  });

  await savePathComponents(rawTrackEntries.map(({ uri }) => uri));

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
    }
  }

  if (erroredTracks.length > 0) {
    await db.delete(tracks).where(
      inArray(
        tracks.id,
        erroredTracks.map(({ id }) => id),
      ),
    );
    await db.insert(invalidTracks).values(erroredTracks);
  }

  const { staged, saveErrors } = onboardingStore.getState();
  console.log(
    `Found/updated ${staged} tracks & encountered ${saveErrors} errors in ${stopwatch.lapTime()}.`,
  );
  console.log(`Completed finding & saving audio in ${stopwatch.stop()}`);

  return {
    foundFiles: discoveredTracks,
    unstagedFiles: unstagedTracks,
    changed: discoveredTracks.length - unmodifiedTracks.size,
  };
}

const wantedMetadata = [
  ...MetadataPresets.standard,
  ...["discNumber", "bitrate", "sampleMimeType", "sampleRate"],
] as const;

async function getTrackEntry({
  id,
  uri,
  duration,
  modificationTime,
  filename,
}: MediaLibraryAsset) {
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
