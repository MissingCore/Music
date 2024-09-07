import {
  MetadataPresets,
  StorageVolumesDirectoryPaths,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import { eq } from "drizzle-orm";
import * as MediaLibrary from "expo-media-library";
import type { ExtractAtomValue } from "jotai";
import { atom, getDefaultStore } from "jotai";

import { db } from "@/db";
import { artists, tracks, invalidTracks } from "@/db/schema";
import { createAlbum, deleteTrack } from "@/db/queries";

import {
  allowListAsyncAtom,
  blockListAsyncAtom,
} from "@/features/setting/api/library";

import { Stopwatch } from "@/utils/debug";
import { BATCH_PRESETS, batch } from "@/utils/promise";
import { savePathComponents } from "./library-scan";
import { addTrailingSlash } from "../utils";

/** Help provide info to inform the user of what's happening. */
export const indexStatusAtom = atom<{
  previouslyFound?: number;
  unstaged?: number;
  staged?: number;
  errors?: number;
}>({
  previouslyFound: undefined,
  unstaged: undefined,
  staged: undefined,
  errors: undefined,
});

/**
 * Index tracks with their metadata into our database for fast retrieval.
 */
export async function doAudioIndexing() {
  const jotaiStore = getDefaultStore();
  const stopwatch = new Stopwatch();

  let allowList = await jotaiStore.get(allowListAsyncAtom);
  if (allowList.length === 0) allowList = StorageVolumesDirectoryPaths;
  const blockList = await jotaiStore.get(blockListAsyncAtom);

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
  console.log(
    `Found ${incomingData.length} tracks on device in ${stopwatch.lapTime()}.`,
  );
  // Filter through the audio files and keep the tracks we want.
  const discoveredTracks = incomingData.filter(
    (a) =>
      allowList.some((path) =>
        a.uri.startsWith(`file://${addTrailingSlash(path)}`),
      ) &&
      !blockList.some((path) =>
        a.uri.startsWith(`file://${addTrailingSlash(path)}`),
      ),
  );
  console.log(
    `Filtered down to ${discoveredTracks.length} tracks in ${stopwatch.lapTime()}.`,
  );

  // Get relevant entries inside our database.
  const allTracks = await db.query.tracks.findMany();
  const allInvalidTracks = await db.query.invalidTracks.findMany();
  incrementAtom("previouslyFound", allTracks.length);

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
  incrementAtom("unstaged", discoveredTracks.length - unmodifiedTracks.size);
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
      incrementAtom("staged", fulfilled.length);
      incrementAtom("errors", rejected.length);
    },
  });
  const { staged, errors } = jotaiStore.get(indexStatusAtom);
  console.log(
    `Found/updated ${staged} tracks & encountered ${errors} errors in ${stopwatch.lapTime()}.`,
  );

  return {
    foundFiles: discoveredTracks,
    changed: discoveredTracks.length - unmodifiedTracks.size,
  };
}

/** Returns an object representing data for the found track. */
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
    ...{ duration, uri, modificationTime },
  };
}

/** Removes the file extension from a filename. */
function removeFileExtension(filename: string) {
  return filename.split(".").slice(0, -1).join(".");
}

/** Helper to update `indexStatusAtom` progressively. */
function incrementAtom(
  key: keyof ExtractAtomValue<typeof indexStatusAtom>,
  val: number,
) {
  getDefaultStore().set(indexStatusAtom, (prev) => ({
    ...prev,
    [key]: (prev[key] ?? 0) + val,
  }));
}
