import { createId } from "@paralleldrive/cuid2";
import * as FileSystem from "expo-file-system";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";

import type { Maybe } from "@/utils/types";

/** Creates "image" directory if it doesn't already exist. */
export async function createImageDirectory() {
  try {
    const imgDir = FileSystem.documentDirectory + "images";
    const dir = await FileSystem.getInfoAsync(imgDir);
    if (!dir.exists) await FileSystem.makeDirectoryAsync(imgDir);
  } catch {
    // Silently catch `Directory <> could not be created or already exists`
    // error from `FileSystem.makeDirectoryAsync()` in case it occurs. This
    // shouldn't throw an error as the directory shouldn't exist prior.
  }
}

/** Helper to delete a file if it's defined. */
export async function deleteFile(uri: Maybe<string>) {
  if (uri) await FileSystem.deleteAsync(uri);
}

/**
 * Helper to open the image picker, allowing the user to pick 1 image,
 * then saves that image to our file system, returning the file uri.
 */
export async function pickImage() {
  // No permissions request is needed for launching the image library.
  const result = await ImagePicker.launchImageLibraryAsync({
    base64: true,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });
  if (result.canceled) throw new Error("Action cancelled.");

  const { base64, mimeType } = result.assets[0]!;
  if (!base64) throw new Error("No base64 representation found.");
  if (!mimeType) throw new Error("No mimeType found.");

  return await saveBase64Img(`data:${mimeType};base64,${base64}`);
}

/** Helper to save images to device. */
export async function saveBase64Img(base64Img: string) {
  const { uri: webpUri } = await manipulateAsync(base64Img, [], {
    compress: 0.85, // Preserve 85% of original image quality.
    format: SaveFormat.WEBP,
  });
  const fileUri = FileSystem.documentDirectory + `images/${createId()}.webp`;
  await FileSystem.copyAsync({ from: webpUri, to: fileUri });
  await FileSystem.deleteAsync(webpUri);
  return fileUri;
}
