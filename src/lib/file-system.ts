import * as FileSystem from "expo-file-system";

import { createId } from "@/lib/cuid2";

/** @description Helper to save images to device. */
export async function saveBase64Img(base64Img: string) {
  const [dataMime, base64] = base64Img.split(";base64,");
  const ext = dataMime.slice(11).toLowerCase();

  const fileUri = FileSystem.documentDirectory + `${createId()}.${ext}`;
  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return fileUri;
}

/** @description Helper to delete a file if it's defined. */
export async function deleteFile(uri: string | undefined | null) {
  if (uri) await FileSystem.deleteAsync(uri);
}
