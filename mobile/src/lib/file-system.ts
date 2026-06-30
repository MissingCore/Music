// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { saveBundledAssetToURI } from "@missingcore/native-utils";
import { Directory, File, Paths } from "expo-file-system";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { launchImageLibraryAsync } from "expo-image-picker";
import { Image } from "react-native";

import { db } from "~/db";
import { hashedImages } from "~/db/schema";

import i18next from "~/modules/i18n";

import { addTrailingSlash, removeLeadingSlash } from "~/utils/string";
import type { Maybe } from "~/utils/types";

const resolveAssetSource = Image.resolveAssetSource;

/** Internal app directory where we store images. */
export const ImageDirectory = Paths.join(Paths.document, "images");
export const PlaceholderDirectory = Paths.join(Paths.document, "placeholders");
export const PlaceholderImageFile = Paths.join(
  PlaceholderDirectory,
  "music-glyph.png",
);

/** Creates "image" directory if it doesn't already exist. */
export async function createImageDirectory() {
  const imgDir = new Directory(ImageDirectory);
  if (!imgDir.exists) imgDir.create();

  const placeholderDir = new Directory(PlaceholderDirectory);
  if (!placeholderDir.exists) placeholderDir.create();

  //? Save a bundled asset to the local file system as we can't pass a
  //? `require()` image to `react-native-audio-browser`.
  //? - Ref: https://github.com/expo/expo/issues/41996#issuecomment-3724350425
  try {
    const fallbackImg = new File(PlaceholderImageFile);
    if (fallbackImg.exists) return;
    await saveBundledAssetToURI(
      resolveAssetSource(require("~/resources/images/music-glyph.png")).uri,
      PlaceholderImageFile,
    );
  } catch (err) {
    console.log(err);
  }
}

/** Helper to delete an internal image file if it's defined. */
export function deleteImage(uri: Maybe<string>) {
  if (typeof uri !== "string" || !uri.startsWith(ImageDirectory)) return;
  // Shouldn't throw an error as file should be in location that doesn't
  // require special permissions.
  const file = new File(uri);
  if (file.exists) file.delete();
}

/** Helper to contruct an image URI from a hash. */
export function getImageUri(uri: Maybe<string>) {
  if (typeof uri !== "string") return null;
  if (uri.startsWith("file://")) return uri;
  return `${ImageDirectory}/${uri}.webp`;
}

/** Easily join path components together to create a file. */
export function joinPaths(dirPath: string, relativeFilePath: string) {
  // Ensure `dirPath` starts with `file:///` and ends with a trailing slash.
  let urlStart = removeLeadingSlash(addTrailingSlash(dirPath));
  if (!urlStart.startsWith("file:///")) urlStart = `file:///${urlStart}`;
  // We expect `relativeFilePath` to not start with a leading slash.
  const baseUrl = new URL(relativeFilePath, urlStart);
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

/** Returns selected file if it exists. Throws error if nothing was selected. */
export async function pickFile(mimeTypes: string | string[]) {
  const { canceled, result: file } = await File.pickFileAsync({ mimeTypes });
  if (canceled) throw new Error(i18next.t("err.msg.actionCancel"));
  if (!file.exists) throw new Error(i18next.t("err.msg.noSelect"));
  return file;
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

  //! We require a MD5 hash.
  const pickedImgHash = cachedImg.md5;
  if (!pickedImgHash) return undefined;

  //? Check to see if we've previously saved this image.
  const storedHashedImg = await db.query.hashedImages.findFirst({
    where: (fields, { eq }) => eq(fields.hash, pickedImgHash),
  });
  if (storedHashedImg) {
    cachedImg.delete();
    return storedHashedImg.hash;
  }

  //? Optimize & save image, then create `hashedImages` entry.
  await saveImage({ hash: pickedImgHash, uri: cachedImg.uri });
  await db
    .insert(hashedImages)
    .values({ hash: pickedImgHash, uri: getImageUri(pickedImgHash)! })
    .onConflictDoNothing();
  cachedImg.delete();
  return pickedImgHash;
}

/**
 * Helper to save image to device. `uri` can be an actual uri or a
 * base64 image string.
 */
async function saveImage({ hash, uri }: { hash: string; uri: string }) {
  // Apply any manipulations (we did none).
  const img = await ImageManipulator.manipulate(uri).renderAsync();
  // Saves image to cache directory.
  const { uri: webpUri } = await img.saveAsync({
    compress: 0.85, // Preserve 85% of original image quality.
    format: SaveFormat.WEBP,
  });
  // Move cached image to final location.
  const finalLocation = new File(webpUri);
  await finalLocation.move(new Directory(ImageDirectory));
  finalLocation.rename(`${hash}.webp`);
  return finalLocation.uri;
}
