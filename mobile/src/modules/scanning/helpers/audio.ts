import {
  MetadataPresets,
  StorageVolumesDirectoryPaths,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import { eq, inArray } from "drizzle-orm";
import { getInfoAsync } from "expo-file-system";
import type { Asset as MediaLibraryAsset } from "expo-media-library";
import { getAssetsAsync } from "expo-media-library";

import { db } from "~/db";
import { albums, artists, invalidTracks, tracks } from "~/db/schema";

import { getAlbums, upsertAlbum } from "~/api/album";
import { createArtist } from "~/api/artist";
import { getSaveErrors } from "~/api/setting";
import { createTrack, deleteTrack, getTracks, updateTrack } from "~/api/track";
import { userPreferencesStore } from "~/services/UserPreferences";
import { Queue, musicStore } from "~/modules/media/services/Music";
import { RecentList } from "~/modules/media/services/RecentList";
import { onboardingStore } from "../services/Onboarding";

import { clearAllQueries } from "~/lib/react-query";
import {
  addTrailingSlash,
  getSafeUri,
  removeFileExtension,
} from "~/utils/string";
import { Stopwatch } from "~/utils/debug";
import { BATCH_PRESETS, batch } from "~/utils/promise";
import { savePathComponents } from "./folder";

//#region Saving Function
/** Index tracks with their metadata into our database. */
export async function findAndSaveAudio() {
  const stopwatch = new Stopwatch();

  // Reset tracked values when saving/updating tracks in onboarding store.
  onboardingStore.setState({ staged: 0, saveErrors: 0 });

  const { listAllow, listBlock, minSeconds } = userPreferencesStore.getState();
  const usedDirs =
    listAllow.length > 0 ? listAllow : StorageVolumesDirectoryPaths;

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
      usedDirs.some((path) =>
        a.uri.startsWith(`file://${addTrailingSlash(path)}`),
      ) &&
      !listBlock.some((path) =>
        a.uri.startsWith(`file://${addTrailingSlash(path)}`),
      ) &&
      a.duration > minSeconds,
  );
  console.log(
    `Found ${incomingData.length} tracks, filtered down to ${discoveredTracks.length} in ${stopwatch.lapTime()}.`,
  );

  // Get relevant entries inside our database.
  const allTracks = await getTracks({
    columns: ["id", "modificationTime", "uri"],
    withAlbum: false,
  });
  const allInvalidTracks = await getSaveErrors();
  onboardingStore.setState({ prevSaved: allTracks.length });

  // Find the tracks we can skip indexing or need updating.
  const modifiedTracks = new Set<string>();
  const unmodifiedTracks = new Set<string>();
  discoveredTracks.forEach(({ id, modificationTime, uri }) => {
    const isSaved = allTracks.find((t) => t.id === id);
    const isInvalid = allInvalidTracks.find((t) => t.id === id);
    if (!isSaved && !isInvalid) return; // If we have a new track.

    const lastModified = (isSaved ?? isInvalid)!.modificationTime;
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
    if (modificationTime !== lastModified || isDifferentUri) {
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
  await batch({
    data: unstagedTracks,
    batchAmount: BATCH_PRESETS.PROGRESS,
    callback: async (mediaAsset) => {
      const { id, uri, modificationTime } = mediaAsset;
      const isRetry = allInvalidTracks.find((t) => t.id === id);

      try {
        const trackEntry = await getTrackEntry(mediaAsset);

        // Make sure we have the "folder" structure to this file.
        await savePathComponents(uri);

        if (modifiedTracks.has(id) && !isRetry) {
          // Update existing track.
          await updateTrack(id, trackEntry);
        } else {
          // Save new track.
          await createTrack(trackEntry);
          // Remove track from `InvalidTrack` if it was there previously.
          if (isRetry) {
            await db.delete(invalidTracks).where(eq(invalidTracks.id, id));
          }
        }
      } catch (err) {
        const isError = err instanceof Error;
        const errorInfo = {
          errorName: isError ? err.name : "UnknownError",
          errorMessage: isError ? err.message : "Rejected for unknown reasons.",
        };
        // We may end up here if the track at the given uri doesn't exist anymore.
        console.log(`[Track ${id}] ${errorInfo.errorMessage}`);

        // Delete the track and its relation, then manually add it to
        // `InvalidTrack` schema (as the track may not exist prior).
        await deleteTrack(id);
        await db
          .insert(invalidTracks)
          .values({ id, uri, modificationTime, ...errorInfo })
          .onConflictDoUpdate({
            target: invalidTracks.id,
            set: { modificationTime, ...errorInfo },
          });

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
  const assetInfo = await getInfoAsync(getSafeUri(uri));

  // Add new artists to the database.
  await Promise.allSettled(
    [t.artist, t.albumArtist]
      .filter((name) => name !== null && name.trim() !== "")
      .map((name) => createArtist({ name: name!.trim() })),
  );

  // Add new album to the database. The unique key on `Album` covers the rare
  // case where an artist releases multiple albums with the same name.
  let albumId: string | null = null;
  if (!!t.albumTitle?.trim() && !!t.albumArtist?.trim()) {
    const newAlbum = await upsertAlbum({
      name: t.albumTitle.trim(),
      artistName: t.albumArtist.trim(),
      releaseYear: t.year ?? -1,
    });
    if (newAlbum) albumId = newAlbum.id;
  }

  return {
    ...{ id, name: t.title?.trim() || removeFileExtension(filename) },
    ...{ artistName: t.artist?.trim() || null, albumId, track: t.trackNumber },
    ...{ disc: t.discNumber, format: t.sampleMimeType, bitrate },
    ...{ sampleRate, duration, uri, modificationTime, fetchedArt: false },
    ...{ size: assetInfo.exists ? (assetInfo.size ?? 0) : 0 },
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

  // Remove anything else that's unused.
  await removeUnusedCategories();

  if (unusedTrackIds.length > 0) clearAllQueries();
}

/** Remove any albums or artists that aren't used. */
export async function removeUnusedCategories() {
  // Remove unused albums.
  const allAlbums = await getAlbums({ columns: ["id"], trackColumns: ["id"] });
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

  // Remove these values from the recent list.
  const removedLists = [
    ...unusedAlbumIds.map((id) => ({ type: "album", id })),
    ...unusedArtistNames.map((name) => ({ type: "artist", id: name })),
  ] as Array<{ type: "album" | "artist"; id: string }>;
  if (removedLists.length > 0) RecentList.removeEntries(removedLists);
}
//#endregion
