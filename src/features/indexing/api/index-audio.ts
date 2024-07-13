import { getAudioMetadata } from "@missingcore/audio-metadata";
import { eq } from "drizzle-orm";
import * as MediaLibrary from "expo-media-library";

import { db } from "@/db";
import { artists, tracks, invalidTracks } from "@/db/schema";
import { createAlbum, deleteTrack } from "@/db/queries";

import { Stopwatch } from "@/utils/debug";
import { isFulfilled, isRejected } from "@/utils/promise";

/** Metadata tags we want to save from each track. */
const wantedTags = ["album", "artist", "name", "track", "year"] as const;

/* FIXME: Temporary work around as we don't really want to support `.mp4` & `.m4a` yet. */
const wantedExtensions = ["mp3", "flac"] as const;

/** @description Index tracks into our database for fast retrieval. */
export async function indexAudio() {
  const stopwatch = new Stopwatch();

  // Get list of audio files supported by `@missingcore/audio-metdata`.
  const assetOptions = { mediaType: "audio", first: 0 } as const;
  const { totalCount } = await MediaLibrary.getAssetsAsync(assetOptions);
  const audioFiles = (
    await MediaLibrary.getAssetsAsync({ ...assetOptions, first: totalCount })
  ).assets.filter((a) =>
    wantedExtensions.some((ext) => a.filename.endsWith(`.${ext}`)),
  );

  // Get relevant entries inside our database.
  const allAlbums = await db.query.albums.findMany();
  const allTracks = await db.query.tracks.findMany();
  const allInvalidTracks = await db.query.invalidTracks.findMany();

  // Find the tracks we can skip indexing or need updating.
  const unmodifiedTracks = new Set<string>();
  const modifiedTracks = new Set<string>();
  audioFiles.forEach(({ id, modificationTime }) => {
    const isSaved = allTracks.find((t) => t.id === id);
    const isInvalid = allInvalidTracks.find((t) => t.id === id);
    if (!isSaved && !isInvalid) return; // If we have a new track.

    const lastModified = (isSaved ?? isInvalid)!.modificationTime;
    // Retry indexing if modification time is different.
    if (modificationTime !== lastModified) modifiedTracks.add(id);
    else unmodifiedTracks.add(id);
  });

  // Get the metadata for all new or modified tracks.
  const incomingTrackData = await Promise.allSettled(
    audioFiles
      .filter(({ id }) => !unmodifiedTracks.has(id))
      .map(async ({ id, uri, duration, modificationTime }) => {
        try {
          const { metadata } = await getAudioMetadata(uri, wantedTags);
          if (!metadata.artist) throw new Error("Track has no artist.");
          if (!metadata.name) throw new Error("Track has no name.");
          return {
            ...{ id, uri, duration, modificationTime, ...metadata },
            ...{ artist: metadata.artist!, name: metadata.name! },
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
    `Got metadata of ${incomingTrackData.length} tracks in ${stopwatch.lapTime()}.`,
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
    [...new Set(validTrackData.map(({ artist }) => artist))].map((name) =>
      db.insert(artists).values({ name }).onConflictDoNothing(),
    ),
  );

  // Add new albums to database (albums may have the same name, but different artists).
  const albumInfoMap: Record<
    string,
    { album: string; artist: string; year: number | null }
  > = {};
  const newAlbums = new Set(
    validTrackData
      .filter(({ album }) => !!album)
      .map(({ album, artist, year }) => {
        // An artist can releases multiple albums with the same name (ie: Weezer).
        const key = `${album} ${artist} ${year}`;
        albumInfoMap[key] = { album: album!, artist, year: year ?? null };
        return key;
      }),
  );
  const albumIdMap: Record<string, string> = {};
  await Promise.allSettled(
    [...newAlbums].map(async (albumKey) => {
      const { album, artist, year } = albumInfoMap[albumKey]!;
      let exists = allAlbums.find(
        (a) =>
          a.name === album && a.artistName === artist && a.releaseYear === year,
      );
      const entry = { name: album, artistName: artist, releaseYear: year };
      if (!exists) exists = await createAlbum(entry);
      albumIdMap[albumKey] = exists.id;
    }),
  );

  // Add new & updated tracks to the database.
  await Promise.allSettled(
    validTrackData.map(async ({ year, artist, album, id, ...rest }) => {
      const albumKey = `${album} ${artist} ${year}`;
      const albumId = album ? albumIdMap[albumKey]! : null;

      const newTrackData = { id, artistName: artist, albumId, ...rest };
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
    }),
  );

  return audioFiles;
}
