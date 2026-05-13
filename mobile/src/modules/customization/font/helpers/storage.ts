import { createId } from "@paralleldrive/cuid2";
import { Directory, File, Paths } from "expo-file-system";

export const FontDirectory = Paths.join(Paths.document, "fonts");

export async function createFontDirectory() {
  const fontDir = new Directory(FontDirectory);
  if (!fontDir.exists) fontDir.create();
}

export async function saveFont(cachedUri: string) {
  const file = new File(cachedUri);
  const destination = new File(FontDirectory, `${createId()}${file.extension}`);
  file.copy(destination);
  //! Delete cached file. With Expo SDK 56, we should be able to copy from
  //! `content:///` URIs.
  file.delete();
  return destination.uri;
}
