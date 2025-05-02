import { createId } from "@paralleldrive/cuid2";
import {
  copyAsync,
  deleteAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { launchImageLibraryAsync } from "expo-image-picker";

import type { Maybe } from "~/utils/types";

/** Internal app directory where we store images. */
export const ImageDirectory = documentDirectory + "images";

/** Creates "image" directory if it doesn't already exist. */
export async function createImageDirectory() {
  try {
    const dir = await getInfoAsync(ImageDirectory);
    if (!dir.exists) await makeDirectoryAsync(ImageDirectory);
  } catch {
    // Silently catch `Directory <> could not be created or already exists`
    // error from `makeDirectoryAsync()` in case it occurs. This
    // shouldn't throw an error as the directory shouldn't exist prior.
  }
}

/** Helper to delete an internal image file if it's defined. */
export async function deleteImage(uri: Maybe<string>) {
  if (uri && uri.startsWith(ImageDirectory))
    await deleteAsync(uri, { idempotent: true });
}

/**
 * Helper to open the image picker, allowing the user to pick 1 image,
 * then saves that image to our file system, returning the file uri.
 */
export async function pickImage() {
  // No permissions request is needed for launching the image library.
  const result = await launchImageLibraryAsync();
  if (result.canceled) throw new Error("Action cancelled.");
  if (!result.assets[0]) throw new Error("Nothing selected.");
  const fileUri = await saveImage(result.assets[0].uri);
  await deleteAsync(result.assets[0].uri); // Delete cached image.
  return fileUri;
}

/**
 * Helper to save image to device. `uri` can be an actual uri or a
 * base64 image string.
 */
export async function saveImage(uri: string) {
  const { uri: webpUri } = await manipulateAsync(uri, [], {
    compress: 0.85, // Preserve 85% of original image quality.
    format: SaveFormat.WEBP,
  });
  const fileUri = documentDirectory + `images/${createId()}.webp`;
  await copyAsync({ from: webpUri, to: fileUri });
  await deleteAsync(webpUri);
  return fileUri;
}
