import { getArtwork } from "@missingcore/react-native-metadata-retriever";
import { eq, isNotNull } from "drizzle-orm";
import * as FileSystem from "expo-file-system";

import { db } from "@/db";
import { albums, artists, playlists, tracks } from "@/db/schema";

import { getAlbums, updateAlbum } from "@/api/album";
import { getTracks, updateTrack } from "@/api/track";
import { onboardingStore } from "../services/Onboarding";

import { ImageDirectory, deleteImage, saveImage } from "@/lib/file-system";
import { clearAllQueries } from "@/lib/react-query";
import { Stopwatch } from "@/utils/debug";
import { batch } from "@/utils/promise";

//#region Saving Function
/** Save artwork for albums & tracks. */
export async function findAndSaveArtwork() {
  const stopwatch = new Stopwatch();

  const uncheckedTracks = await getTracks([eq(tracks.fetchedArt, false)]);
  const albumsWithCovers = new Set(
    (await getAlbums([isNotNull(albums.artwork)])).map(({ id }) => id),
  );

  // Initiate the image saving phase.
  onboardingStore.setState({
    phase: "image",
    checked: 0,
    unchecked: uncheckedTracks.length,
    found: 0,
  });

  let newArtworkCount = 0;
  let checkedFiles = 0;

  for (const { id, albumId, uri, name, artwork } of uncheckedTracks) {
    // Indicate we attempted to find artwork for a track. Do this before
    // physically attempting to save the artwork in case an OOM error occurs,
    // in which the app will essentially become "bricked".
    await updateTrack(id, { fetchedArt: true });
    checkedFiles++;
    // Prevent excessive `setState` on Zustand store which may cause an
    // "Warning: Maximum update depth exceeded.".
    if (checkedFiles % 25 === 0) {
      onboardingStore.setState({ checked: checkedFiles });
    }

    // Make sure the track doesn't have `artwork` and either be unassociated
    // with an album or its album doesn't have `artwork`.
    if (!artwork && (!albumId || !albumsWithCovers.has(albumId))) {
      try {
        const base64Artwork = await getArtwork(uri);
        if (base64Artwork) {
          const artwork = await saveImage(base64Artwork);
          if (albumId) {
            await updateAlbum(albumId, { artwork });
            albumsWithCovers.add(albumId);
          } else {
            await updateTrack(id, { artwork });
          }
          newArtworkCount++;
          onboardingStore.setState((prev) => ({ found: prev.found + 1 }));
        }
      } catch (err) {
        // In case we fail to save an image due to having an invalid base64 string.
        console.log(`[Error] Failed to get or save image for "${name}".`);
      }
    }
  }
  console.log(
    `Finished saving ${newArtworkCount} new cover images in ${stopwatch.lapTime()}.`,
  );

  if (newArtworkCount > 0) clearAllQueries();
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
