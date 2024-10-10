import {
  MetadataPresets,
  StorageVolumesDirectoryPaths,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import { eq } from "drizzle-orm";
import * as MediaLibrary from "expo-media-library";

import { db } from "@/db";
import { albums, artists, tracks, invalidTracks } from "@/db/schema";
import { createAlbum, deleteTrack, getAlbums } from "@/db/queries";

import { userPreferencesStore } from "@/services/UserPreferences";
import {
  Queue,
  RecentList,
  musicStore,
  resetState,
} from "@/modules/media/services/Music";
import { onboardingStore } from "../services/Onboarding";

import { clearAllQueries } from "@/lib/react-query";
import { addTrailingSlash, removeFileExtension } from "@/utils/string";
import { Stopwatch } from "@/utils/debug";
import { BATCH_PRESETS, batch } from "@/utils/promise";
import { savePathComponents } from "./folder";

//#region Saving Function
/** Index tracks with their metadata into our database. */
export async function findAndSaveAudio() {
  const stopwatch = new Stopwatch();

  // Initiate the track saving phase.
  onboardingStore.setState({
    phase: "tracks",
    prevSaved: 0,
    unstaged: 0,
    staged: 0,
    saveErrors: 0,
  });

  const { listAllow, listBlock, minSeconds } = userPreferencesStore.getState();
  const usedDirs =
    listAllow.length > 0 ? listAllow : StorageVolumesDirectoryPaths;

  // Get all audio files discoverable by `expo-media-library`.
  const incomingData: MediaLibrary.Asset[] = [];
  let isComplete = false;
  let lastRead: string | undefined;
  do {
    const { assets, endCursor, hasNextPage } =
      await MediaLibrary.getAssetsAsync({
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
  const allTracks = await db.query.tracks.findMany();
  const allInvalidTracks = await db.query.invalidTracks.findMany();
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
    if (isDifferentUri && unmodifiedTracks.has(id)) {
      unmodifiedTracks.delete(id);
    } else if (!isDifferentUri && modifiedTracks.has(id)) {
      isDifferentUri = true;
    }

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
  stopwatch.lapTime();

  // Create track entries from the minimum amount of data.
  const unstagedTracks = discoveredTracks.filter(
    ({ id }) => !unmodifiedTracks.has(id),
  );
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
          await db.update(tracks).set(trackEntry).where(eq(tracks.id, id));
        } else {
          // Save new track.
          await db.insert(tracks).values(trackEntry);
          // Remove track from `InvalidTrack` if it was there previously.
          if (isRetry) {
            await db.delete(invalidTracks).where(eq(invalidTracks.id, id));
          }
        }
      } catch (err) {
        const errObj =
          err instanceof Error
            ? err
            : {
                name: "UnknownError",
                message: "Rejected for unknown reasons.",
              };
        // We may end up here if the track at the given uri doesn't exist anymore.
        console.log(`[Track ${id}] ${errObj.message}`);

        // Delete the track and its relation, then add it to `InvalidTrack`.
        await deleteTrack(id);
        await db
          .insert(invalidTracks)
          .values({
            ...{ id, uri, modificationTime },
            errorName: errObj.name,
            errorMessage: errObj.message,
          })
          .onConflictDoUpdate({
            target: invalidTracks.id,
            set: { modificationTime },
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

  return {
    foundFiles: discoveredTracks,
    unstagedFiles: unstagedTracks,
    changed: discoveredTracks.length - unmodifiedTracks.size,
  };
}

async function getTrackEntry({
  id,
  uri,
  duration,
  modificationTime,
  filename,
}: MediaLibrary.Asset) {
  const { albumArtist, albumTitle, artist, title, trackNumber, year } =
    await getMetadata(uri, MetadataPresets.standard);

  // Add new artists to the database.
  await Promise.allSettled(
    [artist, albumArtist]
      .filter((name) => name !== null)
      .map((name) => db.insert(artists).values({ name }).onConflictDoNothing()),
  );

  // Add new album to the database. The unique key on `Album` covers the rare
  // case where an artist releases multiple albums with the same name.
  let albumId: string | null = null;
  if (!!albumTitle && !!albumArtist) {
    const newAlbum = await createAlbum({
      name: albumTitle,
      artistName: albumArtist,
      releaseYear: year,
    });
    if (newAlbum) albumId = newAlbum.id;
  }

  return {
    ...{ id, name: title ?? removeFileExtension(filename) },
    ...{ artistName: artist, albumId, track: trackNumber ?? undefined },
    ...{ duration, uri, modificationTime, fetchedArt: false },
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
  const currList = musicStore.getState().playingList;
  const hasRemovedTrack = currList.some((tId) => unusedTrackIds.includes(tId));
  if (hasRemovedTrack) await resetState();
  // Clear the queue of deleted tracks.
  await Queue.removeIds(unusedTrackIds);

  // Remove anything else that's unused.
  await removeUnusedCategories();

  if (unusedTrackIds.length > 0) clearAllQueries();
}

/** Remove any albums or artists that aren't used. */
export async function removeUnusedCategories() {
  // Remove unused albums.
  const allAlbums = await getAlbums();
  const unusedAlbums = allAlbums.filter(({ tracks }) => tracks.length === 0);
  await batch({
    data: unusedAlbums,
    callback: ({ id }) => db.delete(albums).where(eq(albums.id, id)),
  });

  // Remove unused artists.
  const allArtists = await db.query.artists.findMany({
    with: {
      albums: { columns: { id: true } },
      tracks: { columns: { id: true } },
    },
  });
  const unusedArtists = allArtists.filter(
    ({ albums, tracks }) => albums.length === 0 && tracks.length === 0,
  );
  await batch({
    data: unusedArtists,
    callback: ({ name }) => db.delete(artists).where(eq(artists.name, name)),
  });

  // Remove these values from the recent list.
  const removedLists = [
    ...unusedAlbums.map(({ id }) => ({ type: "album", id })),
    ...unusedArtists.map(({ name }) => ({ type: "artist", id: name })),
  ] as Array<{ type: "album" | "artist"; id: string }>;
  if (removedLists.length > 0) RecentList.removeEntries(removedLists);
}
//#endregion
