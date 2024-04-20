import { eq } from "drizzle-orm";
import { Audio } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";

import { db } from "@/db";
import { artists, albums, tracks, invalidTracks } from "@/db/schema";
import {
  loadTrackAtom,
  playingInfoAtom,
  resetPlayingInfoAtom,
} from "@/features/playback/api/playing";

import { saveBase64Img, deleteFile } from "@/lib/file-system";
import { getMusicInfoAsync } from "@/utils/getMusicInfoAsync";
import { isFulfilled, isRejected } from "@/utils/promise";

/**
 * @description Reads our music library on load and index all MP3 files
 *  in the SQLite database.
 */
export function useIndexAudio() {
  const loadTrackFn = useSetAtom(loadTrackAtom);
  const playingInfo = useAtomValue(playingInfoAtom);
  const resetPlayingInfo = useSetAtom(resetPlayingInfoAtom);

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
            const metaData = await getMusicInfoAsync(uri, true);
            return { id, uri, duration, modificationTime, ...metaData };
          } catch (err) {
            if (!(err instanceof Error))
              console.log(`[Track ${id}] Rejected for unknown reasons.`);
            else console.log(`[Track ${id}] ${err.message}`);
            throw new Error(id);
          }
        }),
    );
    console.log(
      `Got metadata of ${incomingTrackData.length} tracks in ${(Date.now() - start) / 1000}s.`,
    );

    // Add rejected tracks in "incomingTrackData" to `InvalidTracks` table.
    await Promise.allSettled(
      incomingTrackData.filter(isRejected).map(async ({ reason }) => {
        const trackId = reason.message as string;
        // Delete existing rejected track as we failed to modify it.
        if (modifiedTracks.has(trackId) && !retryTracks.has(trackId)) {
          const [deletedTrack] = await db
            .delete(tracks)
            .where(eq(tracks.id, trackId))
            .returning({ coverSrc: tracks.coverSrc });
          await deleteFile(deletedTrack.coverSrc);
        }

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
    await Promise.allSettled(
      [...new Set(validTrackData.map(({ artist }) => artist))].map(
        async (name) =>
          await db.insert(artists).values({ name }).onConflictDoNothing(),
      ),
    );

    // Add new albums to database (albums may have the same name, but different artists).
    const albumInfoMap: Record<
      string,
      { album: string; artist: string; year: number | null }
    > = {};
    const newAlbums = new Set(
      validTrackData
        .map(({ album, artist, year }) => {
          const key = `${album} ${artist}`;
          if (album) albumInfoMap[key] = { album, artist, year };
          return key;
        })
        .filter((a) => !!a) as string[],
    );
    const albumIdMap: Record<string, string> = {};
    await Promise.allSettled(
      [...newAlbums].map(async (albumArtistKey) => {
        const { album, artist, year } = albumInfoMap[albumArtistKey];
        let exists = allAlbums.find(
          (a) => a.name === album && a.artistName === artist,
        );
        if (!exists) exists = await addAlbum(album, artist, year);
        albumIdMap[albumArtistKey] = exists.id;
      }),
    );

    // Add the tracks to the database.
    await Promise.allSettled(
      validTrackData.map(
        async ({ year: _, artist, album, track, id, ...rest }) => {
          const albumId = album ? albumIdMap[`${album} ${artist}`] : null;

          const newTrackData = {
            ...{ ...rest, id, artistName: artist, albumId },
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

    await cleanUpTracks(
      new Set(mp3Files.map(({ id }) => id)),
      playingInfo.trackList,
      resetPlayingInfo,
    );
    console.log(`Finished overall in ${(Date.now() - start) / 1000}s.`);

    // Save cover images in the background. Resumes where we left off if
    // we didn't finish indexing cover images last session.
    //  - We don't call the function with `await` to make it not-blocking.
    //  - Make sure we run this after cleaning up deleted tracks, albums, and artists.
    indexCoverImgs();

    // Allow audio to play in the background.
    await Audio.setAudioModeAsync({ staysActiveInBackground: true });
    await loadTrackFn();

    setIsComplete(true);
  }, [
    permissionResponse,
    requestPermission,
    playingInfo.trackList,
    resetPlayingInfo,
    loadTrackFn,
  ]);

  useEffect(() => {
    if (permissionResponse && !isComplete) readMusicLibrary();
  }, [permissionResponse, isComplete, readMusicLibrary]);

  return {
    /** The status of audio indexing — does not necessarily mean we have permissions. */
    isComplete,
  };
}

/** @description Helper to create and return a new album. */
async function addAlbum(
  name: string,
  artistName: string,
  releaseYear: number | null,
) {
  const vals = { name, artistName, releaseYear };
  const [newAlbum] = await db.insert(albums).values(vals).returning();
  return newAlbum;
}

/**
 * @description Remove any tracks in our database that we didn't find w/
 *  Expo Media Library.
 */
async function cleanUpTracks(
  usedTrackIds: Set<string>,
  currTrackList: string[],
  resetPlayingInfo: () => void,
) {
  // Delete track entries.
  const allTracks = await db.query.tracks.findMany({ columns: { id: true } });
  const allInvalidTracks = await db.query.invalidTracks.findMany({
    columns: { id: true },
  });
  const tracksToDelete = [
    ...allTracks.map(({ id }) => id),
    ...allInvalidTracks.map(({ id }) => id),
  ].filter((id) => !usedTrackIds.has(id));
  await Promise.allSettled(
    tracksToDelete.map(async (id) => {
      await db.delete(invalidTracks).where(eq(invalidTracks.id, id));
      const [deletedTrack] = await db
        .delete(tracks)
        .where(eq(tracks.id, id))
        .returning({ coverSrc: tracks.coverSrc });
      await deleteFile(deletedTrack.coverSrc);
    }),
  );
  // Clear current track list if it contains a track that's deleted. This
  // prevents any broken behavior if the `trackListSrc` no longer exists
  // (ie: the track deleted was the only track in the album which been
  // deleted).
  const deletedTrackInCurrTrackList = currTrackList.some((tId) =>
    tracksToDelete.includes(tId),
  );
  if (deletedTrackInCurrTrackList) resetPlayingInfo();

  // Remove Albums with no tracks.
  const allAlbums = await db.query.albums.findMany({
    columns: { id: true, coverSrc: true },
    with: { tracks: { columns: { id: true } } },
  });
  await Promise.allSettled(
    allAlbums
      .filter(({ tracks }) => tracks.length === 0)
      .map(async ({ id, coverSrc }) => {
        await deleteFile(coverSrc);
        await db.delete(albums).where(eq(albums.id, id));
      }),
  );

  // Remove Artists with no tracks.
  const allArtists = await db.query.artists.findMany({
    with: { tracks: { columns: { id: true } } },
  });
  await Promise.allSettled(
    allArtists
      .filter(({ tracks }) => tracks.length === 0)
      .map(async ({ name }) => {
        await db.delete(artists).where(eq(artists.name, name));
      }),
  );
}

/** @description Optimizes saving cover images of tracks & albums. */
async function indexCoverImgs() {
  const start = Date.now();

  const uncheckedTracks = await db.query.tracks.findMany({
    where: (fields, { eq }) => eq(fields.fetchedCover, false),
    columns: { id: true, albumId: true, uri: true },
  });
  const _albumsWCovers = await db.query.albums.findMany({
    where: (fields, { isNotNull }) => isNotNull(fields.coverSrc),
    columns: { id: true },
  });
  const albumsWCovers = new Set(_albumsWCovers.map(({ id }) => id));

  let newCoverImgCnt = 0;

  for (const { id, albumId, uri } of uncheckedTracks) {
    // If we don't have an `albumId` or if the album doesn't have a cover image.
    if (!albumId || !albumsWCovers.has(albumId)) {
      const { cover } = await getMusicInfoAsync(uri, false);
      if (cover) {
        // Very slim chance that we might have a "floating" image if we
        // close the app right after saving the image, but before setting
        // `fetchedCover` to `true`.
        const coverSrc = await saveBase64Img(cover);
        if (albumId) {
          await db
            .update(albums)
            .set({ coverSrc })
            .where(eq(albums.id, albumId));
          albumsWCovers.add(albumId);
        } else {
          await db.update(tracks).set({ coverSrc }).where(eq(tracks.id, id));
        }
        newCoverImgCnt++;
      }
    }

    // Regardless, we set `fetchedCover` to `true.
    await db
      .update(tracks)
      .set({ fetchedCover: true })
      .where(eq(tracks.id, id));
  }

  console.log(
    `Finished indexing ${newCoverImgCnt} new cover images in ${(Date.now() - start) / 1000}s.`,
  );
}
