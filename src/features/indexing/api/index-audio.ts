import {
  MetadataPresets,
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
import { MUSIC_DIRECTORY } from "../Config";

/** Index tracks into our database for fast retrieval. */
export async function indexAudio() {
  const stopwatch = new Stopwatch();

  // Limit media to those in the `Music` folder on our device.
  const assetOptions = { mediaType: "audio", first: 0 } as const;
  const { totalCount } = await MediaLibrary.getAssetsAsync(assetOptions);
  const audioFiles = (
    await MediaLibrary.getAssetsAsync({ ...assetOptions, first: totalCount })
  ).assets.filter((a) => a.uri.startsWith(MUSIC_DIRECTORY));

  // Get relevant entries inside our database.
  const allAlbums = await db.query.albums.findMany();
  const allTracks = await db.query.tracks.findMany();
  const allInvalidTracks = await db.query.invalidTracks.findMany();

  // Find the tracks we can skip indexing or need updating.
  const unmodifiedTracks = new Set<string>();
  const modifiedTracks = new Set<string>();
  audioFiles.forEach(({ id, modificationTime, uri }) => {
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
      // eslint-disable-next-line
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

  // Get the metadata for all new or modified tracks.
  const incomingTrackData = await Promise.allSettled(
    audioFiles
      .filter(({ id }) => !unmodifiedTracks.has(id))
      .map(async ({ id, uri, duration, modificationTime, filename }) => {
        try {
          const metadata = await getMetadata(uri, MetadataPresets.standard);
          return {
            ...{ id, uri, duration, modificationTime, ...metadata },
            // Fallback to filename (excludes the file extension).
            ...{ title: metadata.title ?? removeFileExtension(filename) },
          };
        } catch (err) {
          // Propagate error, changing its message to be the track id.
          if (!(err instanceof Error))
            console.log(`[Track ${id}] Rejected for unknown reasons.`);
          else console.log(`[Track ${id}] ${err.message}`);
          throw new Error(id);
        }
      }),
  );
  console.log(
    `Attempted to get metadata of ${incomingTrackData.length} tracks in ${stopwatch.lapTime()}.`,
  );

  // Add rejected tracks to `InvalidTracks` table.
  await Promise.allSettled(
    incomingTrackData.filter(isRejected).map(async ({ reason }) => {
      const trackId = reason.message as string;
      // Delete existing rejected track as we failed to modify it.
      if (modifiedTracks.has(trackId)) await deleteTrack(trackId);

      const { id, uri, modificationTime } = audioFiles.find(
        ({ id }) => id === trackId,
      )!;
      await db
        .insert(invalidTracks)
        .values({ id, uri, modificationTime })
        .onConflictDoUpdate({
          target: invalidTracks.id,
          set: { modificationTime },
        });
    }),
  );

  // Get all the valid track metadata.
  const validTrackData = incomingTrackData
    .filter(isFulfilled)
    .map(({ value }) => value);

  // Add new artists to database.
  await Promise.allSettled(
    [
      ...new Set(
        validTrackData
          .map(({ artist, albumArtist }) => [artist, albumArtist])
          .flat()
          .filter((name) => name !== null),
      ),
    ].map((name) => db.insert(artists).values({ name }).onConflictDoNothing()),
  );

  // Add new albums to database (albums may have the same name, but different artists).
  const albumInfoMap: Record<
    string,
    { name: string; artistName: string; releaseYear: number | null }
  > = {};
  const newAlbums = new Set(
    validTrackData
      .filter(({ albumTitle, albumArtist }) => !!albumTitle && !!albumArtist)
      .map(({ albumTitle: album, albumArtist, year }) => {
        // An artist can releases multiple albums with the same name (ie: Weezer).
        const key = getAlbumKey({ album, albumArtist, year });
        albumInfoMap[key] = {
          name: album!,
          artistName: albumArtist!,
          releaseYear: year,
        };
        return key;
      }),
  );
  const albumIdMap: Record<string, string> = {};
  await Promise.allSettled(
    [...newAlbums].map(async (albumKey) => {
      const entry = albumInfoMap[albumKey]!;
      let exists = allAlbums.find(
        (a) =>
          a.name === entry.name &&
          a.artistName === entry.artistName &&
          a.releaseYear === entry.releaseYear,
      );
      if (!exists) exists = await createAlbum(entry);
      albumIdMap[albumKey] = exists.id;
    }),
  );

  // Add new & updated tracks to the database.
  await Promise.allSettled(
    validTrackData.map(
      async ({
        id,
        albumTitle: album,
        albumArtist,
        artist: artistName,
        year,
        title: name,
        trackNumber,
        ...rest
      }) => {
        const albumKey = getAlbumKey({ album, albumArtist, year });
        const albumId = album ? albumIdMap[albumKey] : null;

        const newTrackData = {
          ...{ id, name, artistName, albumId, track: trackNumber ?? undefined },
          ...rest,
        };
        const isRetriedTrack = allInvalidTracks.find((t) => t.id === id);

        if (modifiedTracks.has(id) && !isRetriedTrack) {
          // Update existing track.
          await db.update(tracks).set(newTrackData).where(eq(tracks.id, id));
        } else {
          // Save new track.
          await db.insert(tracks).values(newTrackData);
          // Remove track from `InvalidTracks` table as it's now correctly structured.
          if (isRetriedTrack)
            await db.delete(invalidTracks).where(eq(invalidTracks.id, id));
        }
      },
    ),
  );

  return { foundFiles: audioFiles, changed: incomingTrackData.length };
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
