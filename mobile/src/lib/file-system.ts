import { File } from "expo-file-system/next";
import { Directory, Paths } from "expo-file-system/next";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { launchImageLibraryAsync } from "expo-image-picker";

import type { Maybe } from "~/utils/types";

/** Internal app directory where we store images. */
export const ImageDirectory = Paths.join(Paths.document, "images");

/** Creates "image" directory if it doesn't already exist. */
export function createImageDirectory() {
  const imgDir = new Directory(ImageDirectory);
  if (!imgDir.exists) imgDir.create();
}

/** Helper to delete an internal image file if it's defined. */
export function deleteImage(uri: Maybe<string>) {
  if (typeof uri !== "string" || !uri.startsWith(ImageDirectory)) return;
  // Shouldn't throw an error as file should be in location that doesn't
  // require special permissions.
  const file = new File(uri);
  if (file.exists) file.delete();
}

/** Helper to determine if we have a `Directory` or `File`. */
export function isFile(file: Directory | File): file is File {
  return (file as File).size !== undefined;
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
  const cachedImg = new File(result.assets[0].uri);
  const fileUri = await saveImage(cachedImg.uri);
  cachedImg.delete();
  return fileUri;
}

/**
 * Helper to save image to device. `uri` can be an actual uri or a
 * base64 image string.
 */
export async function saveImage(uri: string) {
  // Apply any manipulations (we did none).
  const img = await ImageManipulator.manipulate(uri).renderAsync();
  // Saves image to cache directory.
  const { uri: webpUri } = await img.saveAsync({
    compress: 0.85, // Preserve 85% of original image quality.
    format: SaveFormat.WEBP,
  });
  // Move cached image to final location.
  const finalLocation = new File(webpUri);
  finalLocation.move(new Directory(ImageDirectory));
  return finalLocation.uri;
}
