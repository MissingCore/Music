// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import {
  SaveFormat,
  saveHashedArtwork,
} from "@missingcore/react-native-metadata-retriever";
import type { SQL } from "drizzle-orm";
import { eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import AsyncStorage from "expo-sqlite/kv-store";

import { db } from "~/db";
import { albums, hashedImages, tracks } from "~/db/schema";

import { getAlbumsSummary, updateAlbum } from "~/data/album/api";
import { getTracks, updateTrack } from "~/data/track/api";
import { structuredTracksView } from "~/data/views";
import { preferenceStore } from "~/stores/Preference/store";
import { scanningProgressStore } from "../ScanningProgress";

import { ImageDirectory } from "~/lib/file-system";
import { Stopwatch } from "~/utils/debug";
import { chunkArray } from "~/utils/object";
import { BATCH_PRESETS } from "~/utils/promise";

//#region Attempts Tracking
/**
 * A "bail out" in the situation where we encounter an OOM error while
 * batching requests.
 */
const Attempts = {
  key: "ARTWORK_SAVING_ATTEMPTS",
  /** Increment & return the amount of artwork save attempts. */
  async increment(): Promise<number> {
    const _count = await AsyncStorage.getItem(this.key);
    const count = (Number(_count) || 0) + 1;
    await AsyncStorage.setItem(this.key, String(count));
    return count;
  },
  /** Reset the number of artwork save attempts. */
  async reset() {
    await AsyncStorage.removeItem(this.key);
  },
};
//#endregion

type PartialTrack = {
  id: string;
  name: string;
  albumId: string | null;
  uri: string;
};

/** Save artwork for albums & tracks. */
export async function findAndSaveArtwork() {
  const { optimizedImageSave } = preferenceStore.getState();
  const stopwatch = new Stopwatch();

  const saveAttempts = await Attempts.increment();
  const hasOOMed = saveAttempts > 2;

  // Ensure we don't unnecessarily search for artwork.
  const albumsWithCovers = await getAlbumsSummary(false, [
    isNotNull(albums.artwork),
  ]);
  const idsWithCover = albumsWithCovers.map(({ id }) => id);

  if (optimizedImageSave) {
    await db
      .update(tracks)
      .set({ fetchedArt: true })
      .where(
        or(inArray(tracks.albumId, idsWithCover), isNotNull(tracks.artwork)),
      );
  }

  const uncheckedTracks = await getTracks([
    eq(structuredTracksView.fetchedArt, false),
  ]);
  // Sort tracks to optimize SQL queries.
  const singles: PartialTrack[] = [];
  const albumTracks: Record<string, PartialTrack[]> = {};
  uncheckedTracks.forEach((t) => {
    const key = t.albumId;
    if (key === null) singles.push(t);
    else if (Object.hasOwn(albumTracks, key)) albumTracks[key]?.push(t);
    else albumTracks[key] = [t];
  });

  // Initiate the image saving phase.
  scanningProgressStore.setState({
    checkedArtwork: 0,
    uncheckedArtwork: uncheckedTracks.length,
  });

  let newArtworkCount = 0;
  let checkedFiles = 0;
  let prevRemainder = 0;

  const prevHashedImages = await db.query.hashedImages.findMany();
  const knownHashes = new Set(prevHashedImages.map((h) => h.hash));

  // Get artwork for albums.
  const skipAlbumUpdates = new Set(idsWithCover);
  for (const [albumId, values] of Object.entries(albumTracks)) {
    const batchedTrackUpdates: UpsertedTrack[] = [];

    await saveSinglesArtwork(
      values,
      knownHashes,
      async ({ trackId, artworkHash }) => {
        const data = { embeddedArtwork: artworkHash };
        // Have album image be the 1st image found.
        if (!skipAlbumUpdates.has(albumId)) {
          skipAlbumUpdates.add(albumId);
          await updateAlbum(albumId, data);
        }
        // Prioritize batching track updates unless we OOMed 2 times.
        if (!optimizedImageSave) {
          if (hasOOMed) await updateTrack(trackId, data);
          else batchedTrackUpdates.push({ id: trackId, ...data });
        }
        newArtworkCount++;
      },
      { endEarly: optimizedImageSave, markFetched: hasOOMed },
    );

    await upsertTracks(batchedTrackUpdates);

    // Prevent excessive `setState` on Zustand store which may cause an
    // "Warning: Maximum update depth exceeded.".
    prevRemainder = checkedFiles % BATCH_PRESETS.PROGRESS;
    checkedFiles += values.length;
    if (checkedFiles % BATCH_PRESETS.PROGRESS < prevRemainder) {
      scanningProgressStore.setState({ checkedArtwork: checkedFiles });
    }
  }

  // Get artwork for tracks.
  const unsavedTrackArtworkChunks = chunkArray(singles, 50);
  for (const trackChunks of unsavedTrackArtworkChunks) {
    const batchedTrackUpdates: UpsertedTrack[] = [];

    await saveSinglesArtwork(
      trackChunks,
      knownHashes,
      async ({ artworkHash, trackId }) => {
        const data = { embeddedArtwork: artworkHash };
        if (hasOOMed) await updateTrack(trackId, data);
        else batchedTrackUpdates.push({ id: trackId, ...data });
        newArtworkCount++;
      },
      {
        markFetched: hasOOMed,
        onEndIteration: () => {
          checkedFiles++;
          if (checkedFiles % BATCH_PRESETS.PROGRESS === 0) {
            scanningProgressStore.setState({ checkedArtwork: checkedFiles });
          }
        },
      },
    );

    await upsertTracks(batchedTrackUpdates);
  }

  //? Reset attempts & mark all tracks as having their artworks found.
  await Attempts.reset();
  await db
    .update(tracks)
    .set({ fetchedArt: true })
    .where(eq(tracks.fetchedArt, false));

  console.log(
    `Finished saving ${newArtworkCount} new cover images in ${stopwatch.lapTime()}.`,
  );
}

//#region Helpers
/**
 * Returns the hash associated with the track's embedded artwork.
 *
 * **Note:** Will not throw an error.
 */
export async function getArtworkHash(uri: string, knownHashes: Set<string>) {
  try {
    const hashedImage = await saveHashedArtwork(uri, {
      knownHashes: Array.from(knownHashes),
      saveDirectory: ImageDirectory,
      compress: 0.85,
      format: SaveFormat.WEBP,
    });
    if (hashedImage) {
      if (!knownHashes.has(hashedImage.hash))
        await db.insert(hashedImages).values(hashedImage).onConflictDoNothing();
      knownHashes.add(hashedImage.hash);
    }
    return { error: false, artworkHash: hashedImage?.hash || null };
  } catch {
    console.log(`[Error] Failed to save image for "${uri}".`);
    return { error: true, artworkHash: null };
  }
}
//#endregion

//#region Internal Utils
/** Iterate over a list of tracks, finding and saving its artwork. */
async function saveSinglesArtwork(
  singles: PartialTrack[],
  knownHashes: Set<string>,
  onSave: (info: { artworkHash: string; trackId: string }) => Promise<void>,
  options?: {
    endEarly?: boolean;
    markFetched?: boolean;
    onEndIteration?: VoidFunction;
  },
) {
  for (const { id: trackId, uri } of singles) {
    // Indicate we attempted to find artwork for a track. Do this before
    // physically attempting to save the artwork in case an OOM error occurs,
    // in which the app will essentially become "bricked".
    if (options?.markFetched) await updateTrack(trackId, { fetchedArt: true });
    const { artworkHash } = await getArtworkHash(uri, knownHashes);
    if (artworkHash) {
      await onSave({ artworkHash, trackId });
      if (options?.endEarly) return;
    }
    if (options?.onEndIteration) options.onEndIteration();
  }
}

type UpsertedTrack = { id: string; embeddedArtwork: string };

/** Updates the `embeddedArtwork` & `fetchedArt` status of multiple tracks. */
async function upsertTracks(entries: UpsertedTrack[]) {
  if (entries.length === 0) return;

  // Ref: https://orm.drizzle.team/docs/sqlite/guides/update-many-with-different-value
  const sqlChunks: SQL[] = [];

  sqlChunks.push(sql`(case`);
  for (const entry of entries) {
    sqlChunks.push(
      sql`when ${tracks.id} = ${entry.id} then ${entry.embeddedArtwork}`,
    );
  }
  sqlChunks.push(sql`end)`);

  await db
    .update(tracks)
    .set({
      embeddedArtwork: sql.join(sqlChunks, sql.raw(" ")),
      fetchedArt: true,
    })
    .where(
      inArray(
        tracks.id,
        entries.map((entry) => entry.id),
      ),
    );
}
//#endregion
