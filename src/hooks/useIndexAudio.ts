import { eq } from "drizzle-orm";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { useCallback, useEffect, useState } from "react";

import { db } from "@/db";
import { artists, albums, tracks, invalidTracks } from "@/db/schema";

import { createId } from "@/lib/cuid2";
import { getMusicInfoAsync } from "@/utils/getMusicInfoAsync";
import { isFulfilled, isRejected } from "@/utils/promise";

/**
 * @description Reads our music library on load and index all MP3 files
 *  in the SQLite database.
 */
export function useIndexAudio() {
  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [isComplete, setIsComplete] = useState(false);

  const readMusicLibrary = useCallback(async () => {
    const start = Date.now();

    // Make sure we have permissions.
    if (permissionResponse?.status !== "granted") {
      const { canAskAgain, status } = await requestPermission();
      if (canAskAgain) return;
      if (status === "denied") {
        setIsComplete(true);
        return;
      }
    }

    // Get all the audio tracks — MediaLibrary.getAssetsAsync() by default
    // only loads the first 20 tracks.
    const { totalCount } = await MediaLibrary.getAssetsAsync({
      mediaType: "audio",
      first: 0,
    });
    // Keep only the MP3 files (ie: Filter out the `.ogg` files).
    const mp3Files = (
      await MediaLibrary.getAssetsAsync({
        mediaType: "audio",
        first: totalCount,
      })
    ).assets.filter((a) => a.filename.endsWith(".mp3"));

    // Get the entries that exist in our database.
    const allArtists = await db.query.artists.findMany();
    const allAlbums = await db.query.albums.findMany();
    const allTracks = await db.query.tracks.findMany();
    const allInvalidTracks = await db.query.invalidTracks.findMany();

    // Find the tracks we can skip indexing or need updating.
    const unmodifiedTracks = new Set<string>();
    const modifiedTracks = new Set<string>();
    const retryTracks = new Set<string>();
    mp3Files.forEach(({ id, modificationTime }) => {
      const currTrack = allTracks.find((t) => t.id === id);
      const invalidTrack = allInvalidTracks.find((t) => t.id === id);
      if (!currTrack && !invalidTrack) return; // If we have a new track.

      // Considered "modified" if `modificationTime` is newer/greater.
      if (modificationTime > (currTrack ?? invalidTrack)!.modificationTime) {
        modifiedTracks.add(id);
        if (invalidTrack) retryTracks.add(id);
      } else unmodifiedTracks.add(id);
    });

    // Get the metadata for all new/updatable tracks.
    const incomingTrackData = await Promise.allSettled(
      mp3Files
        .filter(({ id }) => !unmodifiedTracks.has(id))
        .map(async ({ id, uri, duration, modificationTime }) => {
          try {
            const metaData = await getMusicInfoAsync(uri);
            return { id, uri, duration, modificationTime, ...metaData };
          } catch (err) {
            if (!(err instanceof Error))
              console.log(`[Track ${id}] Rejected for unknown reasons.`);
            else console.log(`[Track ${id}] ${err.message}`);
            throw new Error(id);
          }
        }),
    );

    // Add rejected tracks in "incomingTrackData" to `InvalidTracks` table.
    await Promise.allSettled(
      incomingTrackData.filter(isRejected).map(async ({ reason }) => {
        const trackId = reason as string;
        // Exclude tracks that already exist (ie: use old data).
        if (modifiedTracks.has(trackId) && !retryTracks.has(trackId)) return;

        const { id, uri, modificationTime } = mp3Files.find(
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

    // Get all the valid track metadata from "incomingTrackData".
    const validTrackData = incomingTrackData
      .filter(isFulfilled)
      .map(({ value }) => value);

    // Add new artists to database.
    const artistNames = new Set(validTrackData.map(({ artist }) => artist));
    const artistIdMap: Record<string, string> = {};
    await Promise.allSettled(
      [...artistNames].map(async (name) => {
        let exists = allArtists.find((a) => a.name === name);
        if (!exists) exists = await addArtist(name);
        artistIdMap[name] = exists.id;
      }),
    );

    // Add new albums to database.
    const albumInfoMap: Record<
      string,
      { artist: string; cover: string | null; year: number | null }
    > = {};
    const newAlbums = new Set(
      validTrackData
        .map(({ album, artist, cover, year }) => {
          if (album) albumInfoMap[album] = { artist, cover, year };
          return album;
        })
        .filter((a) => !!a) as string[],
    );
    const albumIdMap: Record<string, string> = {};
    await Promise.allSettled(
      [...newAlbums].map(async (name) => {
        const { artist, cover, year } = albumInfoMap[name];
        const artistId = artistIdMap[artist];
        let exists = allAlbums.find(
          (a) => a.name === name && a.artistId === artistId,
        );
        if (!exists) exists = await addAlbum(name, artistId, cover, year);
        albumIdMap[name] = exists.id;
      }),
    );

    // Add the tracks to the database.
    await Promise.allSettled(
      validTrackData.map(
        async ({ year: _, artist, album, cover, track, id, ...rest }) => {
          const artistId = artistIdMap[artist];
          const albumId = album ? albumIdMap[album] : null;

          let coverSrc: string | null = null;
          if (!albumId && cover) coverSrc = await saveBase64Img(cover);

          const newTrackData = {
            ...{ ...rest, id, artistId, albumId, coverSrc },
            ...(track ? { track } : {}),
          };
          const isRetriedTrack = retryTracks.has(id);

          if (modifiedTracks.has(id) && !isRetriedTrack) {
            // Delete old cover image if defined before updating track.
            await deleteFile(allTracks.find((t) => t.id === id)!.coverSrc);
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

    await cleanUpTracks(new Set(mp3Files.map(({ id }) => id)));

    setIsComplete(true);
    console.log(`Finished in ${Date.now() - start}ms.`);
  }, [permissionResponse, requestPermission]);

  useEffect(() => {
    if (permissionResponse && !isComplete) readMusicLibrary();
  }, [permissionResponse, isComplete, readMusicLibrary]);

  return {
    /** The status of audio indexing — does not necessarily mean we have permissions. */
    isComplete,
  };
}

/** @description Helper to create and return a new artist. */
async function addArtist(name: string) {
  const [newArtist] = await db.insert(artists).values({ name }).returning();
  return newArtist;
}

/** @description Helper to create and return a new album. */
async function addAlbum(
  name: string,
  artistId: string,
  coverImg: string | null,
  releaseYear: number | null,
) {
  // Create new cover image if exists.
  let coverSrc: string | null = null;
  if (coverImg) coverSrc = await saveBase64Img(coverImg);

  const [newAlbum] = await db
    .insert(albums)
    .values({ name, artistId, coverSrc, releaseYear })
    .returning();
  return newAlbum;
}

/** @description Helper to save images to device. */
async function saveBase64Img(base64Img: string) {
  const [dataMime, base64] = base64Img.split(";base64,");
  const ext = dataMime.slice(11).toLowerCase();

  const fileUri = FileSystem.documentDirectory + `${createId()}.${ext}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return fileUri;
}

/** @description Helper to delete a file if it's defined. */
async function deleteFile(uri: string | undefined | null) {
  if (uri) await FileSystem.deleteAsync(uri);
}

/**
 * @description Remove any tracks in our database that we didn't find w/
 *  Expo Media Library.
 */
async function cleanUpTracks(usedTrackIds: Set<string>) {
  // Delete track entries.
  const allTracks = await db.query.tracks.findMany({ columns: { id: true } });
  const allInvalidTracks = await db.query.invalidTracks.findMany({
    columns: { id: true },
  });
  await Promise.allSettled(
    [...allTracks.map(({ id }) => id), ...allInvalidTracks.map(({ id }) => id)]
      .filter((id) => !usedTrackIds.has(id))
      .map(async (id) => {
        await db.delete(invalidTracks).where(eq(invalidTracks.id, id));
        const [deletedTrack] = await db
          .delete(tracks)
          .where(eq(tracks.id, id))
          .returning({ coverSrc: tracks.coverSrc });
        await deleteFile(deletedTrack.coverSrc);
      }),
  );

  // Remove Albums with no tracks.
  const allAlbums = await db.query.albums.findMany({
    columns: { id: true },
    with: { tracks: { columns: { id: true } } },
  });
  await Promise.allSettled(
    allAlbums
      .filter(({ tracks }) => tracks.length === 0)
      .map(async ({ id }) => {
        const [deletedAlbum] = await db
          .delete(albums)
          .where(eq(albums.id, id))
          .returning({ coverSrc: albums.coverSrc });
        await deleteFile(deletedAlbum.coverSrc);
      }),
  );

  // Remove Artists with no tracks.
  const allArtists = await db.query.artists.findMany({
    columns: { id: true },
    with: { tracks: { columns: { id: true } } },
  });
  await Promise.allSettled(
    allArtists
      .filter(({ tracks }) => tracks.length === 0)
      .map(async ({ id }) => {
        await db.delete(artists).where(eq(artists.id, id));
      }),
  );
}
