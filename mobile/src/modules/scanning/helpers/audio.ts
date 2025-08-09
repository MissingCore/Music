import {
  MetadataPresets,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import { eq, inArray, lt } from "drizzle-orm";
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

import { upsertAlbums } from "~/api/album";
import { createArtists } from "~/api/artist";
import { RECENT_RANGE_MS } from "~/api/recent";
import { deleteTrack, upsertTracks } from "~/api/track";
import { userPreferencesStore } from "~/services/UserPreferences";
import { Queue, musicStore } from "~/modules/media/services/Music";
import { onboardingStore } from "../services/Onboarding";

import { getExcludedColumns, withColumns } from "~/lib/drizzle";
import { Stopwatch } from "~/utils/debug";
import { chunkArray } from "~/utils/object";
import {
  BATCH_PRESETS,
  batch,
  isFulfilled,
  isRejected,
  wait,
} from "~/utils/promise";
import {
  addTrailingSlash,
  getSafeUri,
  removeFileExtension,
} from "~/utils/string";
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

/** Returns `TrackMetadata` or `InvalidTrack`. */
async function safeRetrieveMetadata(asset: MediaLibraryAsset) {
  const { id, uri, modificationTime } = asset;
  try {
    const trackEntry = await getTrackMetadata(asset);
    return Promise.resolve(trackEntry);
  } catch (err) {
    const isError = err instanceof Error;
    const errorInfo = {
      errorName: isError ? err.name : "UnknownError",
      errorMessage: isError ? err.message : "Rejected for unknown reasons.",
    };
    // We may end up here if the track at the given uri doesn't exist anymore.
    console.log(`[Track ${id}] ${errorInfo.errorMessage}`);
    return Promise.reject({ id, uri, modificationTime, ...errorInfo });
  }
}

//#region Internal Helpers
const UpsertInvalidTrackFields = getExcludedColumns([
  "uri",
  "errorName",
  "errorMessage",
  "modificationTime",
]);

function addArtist(args: {
  artistName: string | null | undefined;
  newArtists: string[];
  insertedArtists: Set<string>;
}) {
  const { artistName, newArtists, insertedArtists } = args;
  if (artistName && !insertedArtists.has(artistName)) {
    insertedArtists.add(artistName);
    newArtists.push(artistName);
  }
}

function addAlbum(args: {
  album: { name: string; artistName: string } | undefined;
  newAlbums: Record<string, string[]>;
  insertedAlbums: Record<string, Set<string>>;
}) {
  const { album, newAlbums, insertedAlbums } = args;
  if (!album) return;
  const { name, artistName } = album;
  if (insertedAlbums[artistName]?.has(name)) return;

  if (insertedAlbums[artistName]) insertedAlbums[artistName].add(name);
  else insertedAlbums[artistName] = new Set([name]);

  if (newAlbums[artistName]) newAlbums[artistName].push(name);
  else newAlbums[artistName] = [name];

  return album;
}
//#endregion

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

  const trackBatches = chunkArray(unstagedTracks, 100);
  const insertedArtists = new Set<string>();
  const insertedAlbums: Record<string, Set<string>> = {};
  const albumIdMap: Record<string, Record<string, string>> = {};
  for (const tBatch of trackBatches) {
    const res = await Promise.allSettled(tBatch.map(safeRetrieveMetadata));
    const rawEntries = res.filter(isFulfilled).map((r) => r.value);
    const errored: InvalidTrack[] = res.filter(isRejected).map((r) => r.reason);
    onboardingStore.setState((prev) => ({
      staged: prev.staged + rawEntries.length,
      saveErrors: prev.saveErrors + errored.length,
    }));

    if (errored.length > 0) {
      const erroredIds = errored.map(({ id }) => id);
      await db.delete(tracks).where(inArray(tracks.id, erroredIds));
      await db.insert(invalidTracks).values(errored).onConflictDoUpdate({
        target: invalidTracks.id,
        set: UpsertInvalidTrackFields,
      });
    }

    if (rawEntries.length === 0) continue;
    await savePathComponents(rawEntries.map(({ uri }) => uri));

    // Insert artists & albums that haven't been inserted yet.
    const newArtists: string[] = [];
    const newAlbums: Record<string, string[]> = {};
    rawEntries.forEach(({ artistName, album }) => {
      addArtist({ artistName, insertedArtists, newArtists });
      addArtist({ artistName: album?.artistName, insertedArtists, newArtists });
      addAlbum({ album, insertedAlbums, newAlbums });
    });

    if (newArtists.length > 0) {
      await createArtists(newArtists.map((name) => ({ name })));
    }
    if (Object.keys(newAlbums).length > 0) {
      const createdAlbums = await upsertAlbums(
        Object.entries(newAlbums).flatMap(([artistName, names]) =>
          names.map((name) => ({ name, artistName })),
        ),
      );
      createdAlbums.map(({ id, name, artistName }) => {
        if (albumIdMap[artistName]) albumIdMap[artistName][name] = id;
        else albumIdMap[artistName] = { [name]: id };
      });
    }

    // Create or update tracks.
    const newTracks = rawEntries.map(({ album, ...t }) => {
      let albumId: string | null = null;
      if (album) albumId = albumIdMap[album.artistName]?.[album.name] || null;
      return { ...t, albumId, discoverTime: Date.now() };
    });
    const newIds = newTracks.map(({ id }) => id);
    await upsertTracks(newTracks);
    await db.delete(invalidTracks).where(inArray(invalidTracks.id, newIds));
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
