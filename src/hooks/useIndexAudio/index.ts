import { eq } from "drizzle-orm";
import { Audio } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";

import { db } from "@/db";
import { artists, albums, tracks, invalidTracks } from "@/db/schema";
import { queueRemoveItemsAtom } from "@/features/playback/api/queue";
import {
  loadTrackAtom,
  trackListAtom,
  resetPlayingInfoAtom,
} from "@/features/playback/api/track";
import { dbCleanUp } from "./dbCleanUp";
import { saveCoverImagesOnce } from "./saveCoverImages";

import { deleteFile } from "@/lib/file-system";
import { getMusicInfoAsync } from "@/utils/getMusicInfoAsync";
import { isFulfilled, isRejected } from "@/utils/promise";

/**
 * @description Reads our music library on load and index all MP3 files
 *  in the SQLite database.
 */
export function useIndexAudio() {
  const loadTrackFn = useSetAtom(loadTrackAtom);
  const trackList = useAtomValue(trackListAtom);
  const resetPlayingInfo = useSetAtom(resetPlayingInfoAtom);
  const removeItemsInQueue = useSetAtom(queueRemoveItemsAtom);

  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions();
  const [isComplete, setIsComplete] = useState(false);

  const readMusicLibrary = useCallback(async () => {
    const start = performance.now();

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
      `Got metadata of ${incomingTrackData.length} tracks in ${((performance.now() - start) / 1000).toFixed(4)}s.`,
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
            .returning({ artwork: tracks.artwork });
          await deleteFile(deletedTrack.artwork);
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
            await deleteFile(allTracks.find((t) => t.id === id)!.artwork);
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

    await dbCleanUp(
      new Set(mp3Files.map(({ id }) => id)),
      trackList.data,
      resetPlayingInfo,
      removeItemsInQueue,
    );
    console.log(
      `Finished overall in ${((performance.now() - start) / 1000).toFixed(4)}s.`,
    );

    // Save cover images in the background. Resumes where we left off if
    // we didn't finish indexing cover images last session.
    //  - We don't call the function with `await` to make it not-blocking.
    //  - Make sure we run this after cleaning up deleted tracks, albums, and artists.
    saveCoverImagesOnce();

    // Allow audio to play in the background.
    await Audio.setAudioModeAsync({ staysActiveInBackground: true });
    await loadTrackFn();

    setIsComplete(true);
  }, [
    permissionResponse,
    requestPermission,
    trackList.data,
    resetPlayingInfo,
    removeItemsInQueue,
    loadTrackFn,
  ]);

  useEffect(() => {
    if (permissionResponse && !isComplete) readMusicLibrary();
  }, [permissionResponse, isComplete, readMusicLibrary]);

  /** The status of audio indexing — does not necessarily mean we have permissions. */
  return isComplete;
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
