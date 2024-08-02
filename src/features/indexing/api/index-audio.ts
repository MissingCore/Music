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

import { Stopwatch } from "@/utils/debug";
import { isFulfilled, isRejected } from "@/utils/promise";
import type { Maybe } from "@/utils/types";
import { addTrailingSlash } from "../utils";

/**
 * Index tracks and their metadata into our database for fast retrieval.
 *
 * Although doing lots of things at once (ie: `Promise.all` lots of promises
 * at once) may be faster, it may crash on devices with less memory.
 *
 * The overall saving strategy is broken up into 2 phases: Sparse Saving &
 * Background Saving.
 *
 * Phase 1: Sparse Saving
 *  1. Get all audio files on the device and filter out the ones we want.
 *  2. Sort the incoming tracks by those which are new, modified, or unmodified.
 *     - Modified tracks in `InvalidTrack` will be removed from the table.
 *     - Modified tracks in `Track` will have their `fetchedMeta` set to `false`.
 *  3. Create `Track` entries from the minimum amount of data.
 *
 * Phase 2: Background Saving
 *  1.
 */
export async function indexAudio() {
  const stopwatch = new Stopwatch();

  // Get all audio files discoverable by `expo-media-library`.
  const incomingData: MediaLibrary.Asset[] = [];
  let isComplete = false;
  let lastRead: string | undefined;
  do {
    const { assets, endCursor, hasNextPage } =
      await MediaLibrary.getAssetsAsync({
        after: lastRead,
        first: 500,
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
  stopwatch.lapTime();

  // Remove any invalid tracks that were modified.
  const modifiedInvalidTracks = allInvalidTracks
    .filter(({ id }) => modifiedTracks.has(id))
    .map(({ id }) => id);
  await Promise.allSettled(
    modifiedInvalidTracks.map((id) =>
      db.delete(invalidTracks).where(eq(invalidTracks.id, id)),
    ),
  );

  // Create track entries from the minimum amount of data.
  const newTracks = discoveredTracks.filter(
    ({ id }) =>
      (!unmodifiedTracks.has(id) && !modifiedTracks.has(id)) ||
      modifiedInvalidTracks.includes(id),
  );
  for (let i = 0; i < newTracks.length; i += 200) {
    await Promise.allSettled(
      newTracks
        .slice(i, i + 200)
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

  // Set `fetchedMeta` on `modifiedTracks` to `false`.
  await Promise.allSettled(
    [...modifiedTracks]
      .filter((id) => !modifiedInvalidTracks.includes(id))
      .map((id) =>
        db.update(tracks).set({ fetchedMeta: false }).where(eq(tracks.id, id)),
      ),
  );

  return {
    foundFiles: discoveredTracks,
    changed: discoveredTracks.length - unmodifiedTracks.size,
  };
}

/** Ensure we use the right key to get the album id. */
export function getAlbumKey(key: {
  album: Maybe<string>;
  albumArtist: Maybe<string>;
  year: Maybe<number>;
}) {
  return `${encodeURIComponent(key.album ?? "")} ${encodeURIComponent(key.albumArtist ?? "")} ${key.year}`;
}

/** Removes the file extension from a filename. */
function removeFileExtension(filename: string) {
  return filename.split(".").slice(0, -1).join(".");
}
