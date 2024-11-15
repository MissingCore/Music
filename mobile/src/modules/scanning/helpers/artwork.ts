import { getArtwork } from "@missingcore/react-native-metadata-retriever";
import { eq, isNotNull } from "drizzle-orm";
import * as FileSystem from "expo-file-system";

import { db } from "@/db";
import { albums, playlists, tracks } from "@/db/schema";

import { getAlbums } from "@/api/album";
import { getTracks } from "@/api/track";
import { onboardingStore } from "../services/Onboarding";

import { deleteFile, saveBase64Img } from "@/lib/file-system";
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

  for (const { id, albumId, uri, name, artwork } of uncheckedTracks) {
    // Make sure the track doesn't have `artwork` and either be unassociated
    // with an album or its album doesn't have `artwork`.
    if (!artwork && (!albumId || !albumsWithCovers.has(albumId))) {
      try {
        const base64Artwork = await getArtwork(uri);
        if (base64Artwork) {
          const artwork = await saveBase64Img(base64Artwork);
          if (albumId) {
            await db
              .update(albums)
              .set({ artwork })
              .where(eq(albums.id, albumId));
            albumsWithCovers.add(albumId);
          } else {
            await db.update(tracks).set({ artwork }).where(eq(tracks.id, id));
          }
          newArtworkCount++;
          onboardingStore.setState((prev) => ({ found: prev.found + 1 }));
        }
      } catch (err) {
        // In case we fail to save an image due to having an invalid base64 string.
        console.log(`[Error] Failed to get or save image for "${name}".`);
      }
    }

    // Indicate we attempted to find artwork for a track.
    await db.update(tracks).set({ fetchedArt: true }).where(eq(tracks.id, id));
    onboardingStore.setState((prev) => ({ checked: prev.checked + 1 }));
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
      [albums, playlists, tracks].map((schema) =>
        db
          .select({ artwork: schema.artwork })
          .from(schema)
          .where(isNotNull(schema.artwork)),
      ),
    )
  )
    .flat()
    .map(({ artwork }) => artwork!);

  // Where we store images on this device.
  const imageDir = FileSystem.documentDirectory + "images";

  // Get & delete all unused images.
  let deletedCount = 0;
  await batch({
    data: (await FileSystem.readDirectoryAsync(imageDir)).filter(
      (imageName) => !usedUris.some((uri) => uri.endsWith(imageName)),
    ),
    callback: (imageName) => deleteFile(`${imageDir}/${imageName}`),
    onBatchComplete: (isFulfilled) => {
      deletedCount += isFulfilled.length;
    },
  });

  console.log(`Deleted ${deletedCount} unlinked images.`);
}
//#endregion
