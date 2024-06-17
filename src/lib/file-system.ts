import { createId } from "@paralleldrive/cuid2";
import * as FileSystem from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

import type { Maybe } from "@/utils/types";

/** @description Creates "image" directory if it doesn't already exist. */
export async function createImageDirectory() {
  const imgDir = FileSystem.documentDirectory + "images";
  const dir = await FileSystem.getInfoAsync(imgDir);
  if (!dir.exists) {
    await FileSystem.makeDirectoryAsync(imgDir);
  }
}

/** @description Helper to delete a file if it's defined. */
export async function deleteFile(uri: Maybe<string>) {
  if (uri) await FileSystem.deleteAsync(uri);
}

/**
 * @description Helper to open the image picker, allowing the user to pick
 *  1 image, then saves that image to our file system, returning the
 *  file uri.
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

/** @description Helper to save images to device. */
export async function saveBase64Img(base64Img: string) {
  const [dataMime, base64] = base64Img.split(";base64,");
  const ext = dataMime.slice(11).toLowerCase();

  const fileUri = FileSystem.documentDirectory + `images/${createId()}.${ext}`;
  await FileSystem.writeAsStringAsync(fileUri, base64!, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return fileUri;
}
