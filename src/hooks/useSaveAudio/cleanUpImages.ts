import * as FileSystem from "expo-file-system";

import { db } from "@/db";
import { settingKeys } from "@/features/setting/api/_queryKeys";

import { deleteFile } from "@/lib/file-system";
import { queryClient } from "@/lib/react-query";

/**
 * @description Get all the images we stored in this app's "private"
 *  directory and delete the ones that have no link in our database.
 */
export async function cleanUpImages() {
  const start = performance.now();

  // `FileSystem.documentDirectory` is `null` for "web".
  if (!FileSystem.documentDirectory) return;
  const imageDir = FileSystem.documentDirectory + "images";

  // Get all the uris of images saved in the database.
  const usedUris = (
    await Promise.all([
      db.query.albums.findMany({
        where: (fields, { isNotNull }) => isNotNull(fields.artwork),
        columns: { artwork: true },
      }),
      db.query.playlists.findMany({
        where: (fields, { isNotNull }) => isNotNull(fields.artwork),
        columns: { artwork: true },
      }),
      db.query.tracks.findMany({
        where: (fields, { isNotNull }) => isNotNull(fields.artwork),
        columns: { artwork: true },
      }),
    ])
  )
    .flat()
    .map(({ artwork }) => artwork!);

  // Get all the images stored in this app's private directory.
  const savedImages = await FileSystem.readDirectoryAsync(imageDir);

  // Get all unlinked images.
  const unlinkedImages = savedImages.filter(
    (imageName) => !usedUris.some((uri) => uri.endsWith(imageName)),
  );

  // Delete all unlinked images.
  await Promise.all(
    unlinkedImages.map((uri) => deleteFile(`${imageDir}/${uri}`)),
  );

  console.log(
    `Deleted ${unlinkedImages.length} unlinked images in ${((performance.now() - start) / 1000).toFixed(4)}s.`,
  );

  if (unlinkedImages.length > 0) {
    queryClient.invalidateQueries({
      queryKey: settingKeys.storageRelation("image-save-status"),
    });
  }
}
