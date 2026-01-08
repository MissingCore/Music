import { isNotNull } from "drizzle-orm";
import { Directory } from "expo-file-system";

import { db } from "~/db";
import { albums, artists, playlists, tracks } from "~/db/schema";

import { ImageDirectory, deleteImage } from "~/lib/file-system";
import { batch } from "~/utils/promise";

//#region Artwork
export async function cleanupImages() {
  // Get all the uris of images saved in the database.
  const usedUris = (
    await Promise.all([
      ...[artists, playlists].map((schema) =>
        db
          .select({ artwork: schema.artwork })
          .from(schema)
          .where(isNotNull(schema.artwork)),
      ),
      ...[albums, tracks].flatMap((schema) => [
        db
          .select({ artwork: schema.altArtwork })
          .from(schema)
          .where(isNotNull(schema.altArtwork)),
        db
          .select({ artwork: schema.embeddedArtwork })
          .from(schema)
          .where(isNotNull(schema.embeddedArtwork)),
      ]),
    ])
  )
    .flat()
    .map(({ artwork }) => artwork!);

  // Get & delete all unused images.
  let deletedCount = 0;
  await batch({
    data: new Directory(ImageDirectory)
      .list()
      // There shouldn't be any directories in the "Image Directory".
      .filter((file) => !usedUris.some((uri) => file.uri === uri)),
    callback: (image) => deleteImage(image.uri),
    onBatchComplete: (isFulfilled) => {
      deletedCount += isFulfilled.length;
    },
  });

  console.log(`Deleted ${deletedCount} unlinked images.`);
}
//#endregion
