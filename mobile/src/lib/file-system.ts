import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { launchImageLibraryAsync } from "expo-image-picker";

import i18next from "~/modules/i18n";

import { addTrailingSlash, removeLeadingSlash } from "~/utils/string";
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

/** Easily join path components together to create a file. */
export function joinPaths(baseDir: string, path: string) {
  // `baseDir` starts with `file:///` and ends with a trailing slash.
  let urlStart = removeLeadingSlash(addTrailingSlash(baseDir));
  if (!urlStart.startsWith("file:///")) urlStart = `file:///${urlStart}`;
  const baseUrl = new URL(path, urlStart);
  // Undo any encoding caused when passing `path` with encodeable components.
  return decodeURI(baseUrl.toString());
}

/** Returns selected directory if it exists. Throws error if nothing was selected. */
export async function pickDirectory() {
  try {
    const dir = await Directory.pickDirectoryAsync();
    if (!dir.exists) throw new Error();
    return dir;
  } catch {
    // Throws error with more generic message that'll be caught by React Query and toasted.
    throw new Error(i18next.t("err.msg.actionCancel"));
  }
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
