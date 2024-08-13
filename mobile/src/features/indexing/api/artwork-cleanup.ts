import { isNotNull } from "drizzle-orm";
import * as FileSystem from "expo-file-system";

import { db } from "@/db";
import { albums, playlists, tracks } from "@/db/schema";

import { deleteFile } from "@/lib/file-system";
import { Stopwatch } from "@/utils/debug";
import { batch } from "@/utils/promise";

/**
 * Deletes any images saved by this app that aren't linked to an album,
 * playlist, or track.
 */
export async function cleanUpArtwork() {
  const stopwatch = new Stopwatch();

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

  // Get & delete all unlinked images.
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

  console.log(
    `Deleted ${deletedCount} unlinked images in ${stopwatch.lapTime()}.`,
  );
}
