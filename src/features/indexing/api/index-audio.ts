import {
  MetadataPresets,
  StorageVolumesDirectoryPaths,
  getMetadata,
} from "@missingcore/react-native-metadata-retriever";
import { eq } from "drizzle-orm";
import * as MediaLibrary from "expo-media-library";

import { db } from "@/db";
import { artists, tracks, invalidTracks } from "@/db/schema";
import { createAlbum, deleteTrack } from "@/db/queries";

import { clearAllQueries } from "@/lib/react-query";
import { Stopwatch } from "@/utils/debug";
import { addTrailingSlash } from "../utils";

/*
  This file exports 2 functions that implements the 2 phases of how we
  save/index tracks into our database: Sparse Saving & Background Saving.

  Although doing lots of things at once (ie: `Promise.all` lots of promises
  at once) may be faster, it may crash on devices with less memory.
*/

/** Number of concurrent tasks for light workloads. */
const BATCH_MINIMAL = 500;
/** Number of concurrent tasks for moderate workloads. */
const BATCH_MODERATE = 400;
/** Number of concurrent tasks for heavy workloads. */
const BATCH_HEAVY = 10;

/**
 * Index tracks into our database for fast retrieval.
 *
 * This implements Phase 1 of our saving strategy:
 *  1. Get all audio files on the device and filter out the ones we want.
 *  2. Sort the incoming tracks by those which are new, modified, or unmodified.
 *     - Modified tracks in `InvalidTrack` will be removed from the table.
 *     - Modified tracks in `Track` will have their `fetchedMeta` set to `false`.
 *  3. Create `Track` entries from the minimum amount of data.
 */
export async function doSparseAudioIndexing() {
  const stopwatch = new Stopwatch();

  // Get all audio files discoverable by `expo-media-library`.
  const incomingData: MediaLibrary.Asset[] = [];
  let isComplete = false;
  let lastRead: string | undefined;
  do {
    const { assets, endCursor, hasNextPage } =
      await MediaLibrary.getAssetsAsync({
        after: lastRead,
        first: BATCH_MINIMAL,
        mediaType: "audio",
      });
    incomingData.push(...assets);
    lastRead = endCursor;
    isComplete = !hasNextPage;
  } while (!isComplete);
  // Filter through the audio files and keep the tracks we want.
  //  - FIXME: In the future, we'll filter based on a whitelist & blacklist.
  const discoveredTracks = incomingData.filter((a) =>
    StorageVolumesDirectoryPaths.some((dir) =>
      a.uri.startsWith(`file://${addTrailingSlash(dir)}Music/`),
    ),
  );
  console.log(`Got list of wanted tracks in ${stopwatch.lapTime()}.`);

  // Get relevant entries inside our database.
  const allTracks = await db.query.tracks.findMany();
  const allInvalidTracks = await db.query.invalidTracks.findMany();

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

  // Remove any invalid tracks that were modified.
  const modifiedInvalidTracks = allInvalidTracks
    .filter(({ id }) => modifiedTracks.has(id))
    .map(({ id }) => id);
  await Promise.allSettled(
    modifiedInvalidTracks.map((id) =>
      db.delete(invalidTracks).where(eq(invalidTracks.id, id)),
    ),
  );
  // Set `fetchedMeta = false` on `modifiedTracks` (that aren't `InvalidTrack`).
  await Promise.allSettled(
    [...modifiedTracks]
      .filter((id) => !modifiedInvalidTracks.includes(id))
      .map((id) =>
        db.update(tracks).set({ fetchedMeta: false }).where(eq(tracks.id, id)),
      ),
  );
  stopwatch.lapTime();

  // Create track entries from the minimum amount of data.
  const newTracks = discoveredTracks.filter(
    ({ id }) =>
      (!unmodifiedTracks.has(id) && !modifiedTracks.has(id)) ||
      modifiedInvalidTracks.includes(id),
  );
  for (let i = 0; i < newTracks.length; i += BATCH_MODERATE) {
    await Promise.allSettled(
      newTracks
        .slice(i, i + BATCH_MODERATE)
        .filter((i) => i !== undefined)
        .map(async ({ id, uri, duration, modificationTime, filename }) => {
          try {
            await db.insert(tracks).values({
              ...{ id, name: removeFileExtension(filename) },
              ...{ duration, uri, modificationTime },
            });
          } catch (err) {
            await db
              .insert(invalidTracks)
              .values({ id, uri, modificationTime });
          }
        }),
    );
  }
  console.log(
    `Attempted to create ${newTracks.length} minimum \`Track\` entries in ${stopwatch.lapTime()}.`,
  );

  return {
    foundFiles: discoveredTracks,
    changed: discoveredTracks.length - unmodifiedTracks.size,
  };
}

/**
 * Index the metadata of tracks into our database for fast retrieval.
 *
 * This implements Phase 2 of our saving strategy:
 *  1. Get all tracks that we haven't saved metadata to (ie: `fetchedMeta = false`).
 *  2. Go through a few at a time and:
 *     - Insert artists & albums into the database if they don't exist.
 *     - Insert new track.
 */
export async function doBackgroundAudioIndexing() {
  const stopwatch = new Stopwatch();

  // Get all tracks that we need to populate/update its metadata.
  const incompleteTracks = await db.query.tracks.findMany({
    where: (fields, { eq }) => eq(fields.fetchedMeta, false),
  });

  // Progressively populate the metadata of tracks.
  for (let i = 0; i < incompleteTracks.length; i += BATCH_HEAVY) {
    await Promise.allSettled(
      incompleteTracks
        .slice(i, i + BATCH_HEAVY)
        .filter((i) => i !== undefined)
        .map(async ({ id, uri, modificationTime }) => {
          try {
            const metadata = await getMetadata(uri, MetadataPresets.standard);
            // Add new artists to the database.
            await Promise.allSettled(
              [metadata.artist, metadata.albumArtist]
                .filter((name) => name !== null)
                .map((name) =>
                  db.insert(artists).values({ name }).onConflictDoNothing(),
                ),
            );
            // Add new album to the database. The unique key on `Album` covers the rare
            // case where an artist releases multiple albums with the same name.
            let albumId: string | null = null;
            if (!!metadata.albumTitle && !!metadata.albumArtist) {
              const newAlbum = await createAlbum({
                name: metadata.albumTitle,
                artistName: metadata.albumArtist,
                releaseYear: metadata.year,
              });
              if (newAlbum) albumId = newAlbum.id;
            }
            // Update track data with found metadata.
            await db
              .update(tracks)
              .set({
                ...(metadata.title ? { name: metadata.title } : {}),
                artistName: metadata.artist,
                albumId,
                track: metadata.trackNumber ?? undefined,
                fetchedMeta: true,
              })
              .where(eq(tracks.id, id));
          } catch (err) {
            // We may end up here if the track at the given uri doesn't exist anymore.
            if (!(err instanceof Error))
              console.log(`[Track ${id}] Rejected for unknown reasons.`);
            else console.log(`[Track ${id}] ${err.message}`);

            // Delete the track and its relation, then add it to `InvalidTrack`.
            await deleteTrack(id);
            await db
              .insert(invalidTracks)
              .values({ id, uri, modificationTime })
              .onConflictDoUpdate({
                target: invalidTracks.id,
                set: { modificationTime },
              });
          }
        }),
    );

    // Clear query cache after each iteration to show progress.
    clearAllQueries();
  }
  console.log(
    `Attempted to populate the metadata of ${incompleteTracks.length} tracks in ${stopwatch.lapTime()}.`,
  );
}

/** Removes the file extension from a filename. */
function removeFileExtension(filename: string) {
  return filename.split(".").slice(0, -1).join(".");
}
