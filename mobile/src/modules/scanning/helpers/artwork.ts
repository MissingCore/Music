import { getArtwork } from "@missingcore/react-native-metadata-retriever";
import { eq, inArray, isNotNull, or } from "drizzle-orm";
import * as FileSystem from "expo-file-system";

import { db } from "@/db";
import type { TrackWithAlbum } from "@/db/schema";
import { albums, artists, playlists, tracks } from "@/db/schema";

import { getAlbums, updateAlbum } from "@/api/album";
import { getTracks, updateTrack } from "@/api/track";
import { onboardingStore } from "../services/Onboarding";

import { ImageDirectory, deleteImage, saveImage } from "@/lib/file-system";
import { clearAllQueries } from "@/lib/react-query";
import { Stopwatch } from "@/utils/debug";
import { BATCH_PRESETS, batch } from "@/utils/promise";

//#region Saving Function
/** Save artwork for albums & tracks. */
export async function findAndSaveArtwork() {
  const stopwatch = new Stopwatch();

  // Ensure we don't unnecessarily seach for artwork.
  const albumsWithCovers = await getAlbums([isNotNull(albums.artwork)]);
  const idsWithCover = albumsWithCovers.map(({ id }) => id);
  await db
    .update(tracks)
    .set({ fetchedArt: true })
    .where(
      or(inArray(tracks.albumId, idsWithCover), isNotNull(tracks.artwork)),
    );

  const uncheckedTracks = await getTracks([eq(tracks.fetchedArt, false)]);
  // Sort tracks to optimize SQL queries.
  const singles: TrackWithAlbum[] = [];
  const albumTracks: Record<string, TrackWithAlbum[]> = {};
  uncheckedTracks.forEach((t) => {
    const key = t.albumId;
    if (key === null) singles.push(t);
    else if (Object.hasOwn(albumTracks, key)) albumTracks[key]!.push(t);
    else albumTracks[key] = [t];
  });

  // Initiate the image saving phase.
  onboardingStore.setState({
    phase: "image",
    checked: 0,
    unchecked: uncheckedTracks.length,
    found: 0,
  });

  let newArtworkCount = 0;
  let checkedFiles = 0;
  let prevRemainder = 0;

  // Get artwork for albums.
  for (const [albumId, values] of Object.entries(albumTracks)) {
    await saveSinglesArtwork(
      values,
      async ({ artworkUri }) => {
        await updateAlbum(albumId, { artwork: artworkUri });
        newArtworkCount++;
      },
      { endEarly: true },
    );
    // Prevent excessive `setState` on Zustand store which may cause an
    // "Warning: Maximum update depth exceeded.".
    prevRemainder = checkedFiles % BATCH_PRESETS.PROGRESS;
    checkedFiles += values.length;
    if (checkedFiles % BATCH_PRESETS.PROGRESS < prevRemainder) {
      onboardingStore.setState({ checked: checkedFiles });
    }
  }

  // Get artwork for tracks.
  await saveSinglesArtwork(
    singles,
    async ({ artworkUri, trackId }) => {
      await updateTrack(trackId, { artwork: artworkUri });
      newArtworkCount++;
    },
    {
      onEndIteration: () => {
        checkedFiles++;
        if (checkedFiles % BATCH_PRESETS.PROGRESS === 0) {
          onboardingStore.setState({ checked: checkedFiles });
        }
      },
    },
  );
  console.log(
    `Finished saving ${newArtworkCount} new cover images in ${stopwatch.lapTime()}.`,
  );

  if (newArtworkCount > 0) clearAllQueries();
}

/** Iterate over a list of tracks, finding and saving its artwork. */
async function saveSinglesArtwork(
  singles: TrackWithAlbum[],
  onSave: (info: { artworkUri: string; trackId: string }) => Promise<void>,
  options?: { endEarly?: boolean; onEndIteration?: () => void },
) {
  for (const { id: trackId, uri, name } of singles) {
    // Indicate we attempted to find artwork for a track. Do this before
    // physically attempting to save the artwork in case an OOM error occurs,
    // in which the app will essentially become "bricked".
    await updateTrack(trackId, { fetchedArt: true });
    try {
      const base64Artwork = await getArtwork(uri);
      if (base64Artwork) {
        const artworkUri = await saveImage(base64Artwork);
        await onSave({ artworkUri, trackId });
        onboardingStore.setState((prev) => ({ found: prev.found + 1 }));
        if (options?.endEarly) return;
      }
    } catch (err) {
      // In case we fail to save an image due to having an invalid base64 string.
      console.log(`[Error] Failed to get or save image for "${name}".`);
    }
    if (options?.onEndIteration) options.onEndIteration();
  }
}
//#endregion

//#region Cleanup Function
export async function cleanupImages() {
  // Get all the uris of images saved in the database.
  const usedUris = (
    await Promise.all(
      [albums, artists, playlists, tracks].map((schema) =>
        db
          .select({ artwork: schema.artwork })
          .from(schema)
          .where(isNotNull(schema.artwork)),
      ),
    )
  )
    .flat()
    .map(({ artwork }) => artwork!);

  // Get & delete all unused images.
  let deletedCount = 0;
  await batch({
    data: (await FileSystem.readDirectoryAsync(ImageDirectory)).filter(
      (imageName) => !usedUris.some((uri) => uri.endsWith(imageName)),
    ),
    callback: (imageName) => deleteImage(`${ImageDirectory}/${imageName}`),
    onBatchComplete: (isFulfilled) => {
      deletedCount += isFulfilled.length;
    },
  });

  console.log(`Deleted ${deletedCount} unlinked images.`);
}
//#endregion
