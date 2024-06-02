import { AudioFileTypes, getAudioMetadata } from "@missingcore/audio-metadata";
import { eq } from "drizzle-orm";
import { Audio } from "expo-av";
import * as MediaLibrary from "expo-media-library";
import { useSetAtom } from "jotai";
import { useCallback, useEffect, useState } from "react";

import { db } from "@/db";
import { artists, albums, tracks, invalidTracks } from "@/db/schema";
import { deleteTrack } from "@/db/queries";
import { loadTrackAtom } from "@/features/playback/api/track";
import { dbCleanUp } from "./dbCleanUp";
import { saveCoverImagesOnce } from "./saveCoverImages";

import { deleteFile } from "@/lib/file-system";
import { isFulfilled, isRejected } from "@/utils/promise";

/** Metadata tags we want to save from each track. */
const wantedTags = ["album", "artist", "name", "track", "year"] as const;

/**
 * @description Reads our music library on load and index all supported files
 *  in the SQLite database.
 */
export function useSaveAudio() {
  const loadTrackFn = useSetAtom(loadTrackAtom);

  const [permissionResponse, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ["audio"],
  });
  const [isComplete, setIsComplete] = useState(false);

  const readMusicLibrary = useCallback(async () => {
    const start = performance.now();

    // Make sure we have permissions.
    if (permissionResponse?.status !== "granted") {
      const { canAskAgain, status } = await requestPermission();
      if (canAskAgain || status === "denied") {
        if (status === "denied") setIsComplete(true);
        return;
      }
    }

    // Get all tracks supported by `@missingcore/audio-metadata` —
    // `getAssetsAsync()` by defaults loads only the first 20 tracks.
    const assetOptions = { mediaType: "audio", first: 0 } as const;
    const { totalCount } = await MediaLibrary.getAssetsAsync(assetOptions);
    const audioFiles = (
      await MediaLibrary.getAssetsAsync({ ...assetOptions, first: totalCount })
    ).assets.filter((a) =>
      AudioFileTypes.some((ext) => a.filename.endsWith(`.${ext}`)),
    );

    // Get the entries that exist in our database.
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
      `Got metadata of ${incomingTrackData.length} tracks in ${((performance.now() - start) / 1000).toFixed(4)}s.`,
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
          if (album) albumInfoMap[key] = { album, artist, year: year ?? null };
          return album ? key : "";
        })
        .filter((a) => !!a), // Filter out empty strings.
    );
    const albumIdMap: Record<string, string> = {};
    await Promise.allSettled(
      [...newAlbums].map(async (albumArtistKey) => {
        const { album, artist, year } = albumInfoMap[albumArtistKey]!;
        let exists = allAlbums.find(
          (a) => a.name === album && a.artistName === artist,
        );
        if (!exists) exists = await addAlbum(album, artist, year);
        albumIdMap[albumArtistKey] = exists.id;
      }),
    );

    // Add new & updated tracks to the database.
    await Promise.allSettled(
      validTrackData.map(
        async ({ year: _, artist, album, track, id, name, ...rest }) => {
          const albumId = album ? albumIdMap[`${album} ${artist}`]! : null;

          const newTrackData = {
            ...{ ...rest, name, id, artistName: artist, albumId },
            ...(track ? { track } : {}),
          };
          const isRetriedTrack = allInvalidTracks.find((t) => t.id === id);

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

    await dbCleanUp(new Set(audioFiles.map(({ id }) => id)));
    console.log(
      `Finished overall in ${((performance.now() - start) / 1000).toFixed(4)}s.`,
    );

    await saveCoverImagesOnce();

    // Allow audio to play in the background.
    await Audio.setAudioModeAsync({ staysActiveInBackground: true });
    await loadTrackFn();

    setIsComplete(true);
  }, [permissionResponse, requestPermission, loadTrackFn]);

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
  return newAlbum!;
}
