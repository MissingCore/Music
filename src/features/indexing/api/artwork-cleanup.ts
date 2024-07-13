import { isNotNull } from "drizzle-orm";
import * as FileSystem from "expo-file-system";

import { db } from "@/db";
import { albums, playlists, tracks } from "@/db/schema";

import { deleteFile } from "@/lib/file-system";
import { Stopwatch } from "@/utils/debug";

/**
 * @description Deletes any images saved by this app that aren't linked
 *  to an album, playlist, or track.
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
  const deletedRes = await Promise.allSettled(
    (await FileSystem.readDirectoryAsync(imageDir))
      .filter((imageName) => !usedUris.some((uri) => uri.endsWith(imageName)))
      .map((imageName) => deleteFile(`${imageDir}/${imageName}`)),
  );

  console.log(
    `Deleted ${deletedRes.length} unlinked images in ${stopwatch.lapTime()}.`,
  );
}
