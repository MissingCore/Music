// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { loadAsync as loadFontsAsync } from "expo-font";

import { toLowerCase, removeFileExtension } from "~/utils/string";
import type { BundledFont, Font } from "./core/constants";
import { FontFamily } from "./core/constants";

//#region Loader
export async function loadCustomFont(fontUri: string) {
  const fileName = fontUri.split("/").at(-1);
  if (!fileName) throw new Error("File name cannot be derived.");
  return loadFontsAsync({ [removeFileExtension(fileName)]: fontUri });
}
//#endregion

//#region Query
function getBundledFontFamily(
  font: BundledFont,
  options?: { bold?: boolean; headline?: boolean },
) {
  const fontCode = font === "Geist Mono" ? "geistMono" : toLowerCase(font);
  if ((options?.headline || options?.bold) && fontCode === "ntype") {
    return FontFamily.ntypeHeadline;
  } else if (
    options?.bold &&
    (fontCode === "geistMono" || fontCode === "roboto" || fontCode === "inter")
  ) {
    return FontFamily[`${fontCode}Medium`];
  }
  return FontFamily[fontCode];
}

/**
 * Returns the correct font used from the codes used to determine the
 * accent & primary font used.
 */
export function getFont(
  font: Font,
  options?: { bold?: boolean; headline?: boolean },
) {
  if (!isBundledFont(font)) {
    const fileName = font.uri.split("/").at(-1);
    if (fileName) return removeFileExtension(fileName);
    return getBundledFontFamily(
      options?.headline ? "NType" : "Roboto",
      options,
    );
  }
  return getBundledFontFamily(font, options);
}

export function getFontDisplayName(font: Font) {
  return isBundledFont(font) ? font : font.name;
}
//#endregion

//#region Validators
export function areFontEqual(fontA: Font, fontB: Font) {
  if (!isBundledFont(fontA) && !isBundledFont(fontB)) {
    return fontA.id === fontB.id;
  }
  return fontA === fontB;
}

export function isBundledFont(value: Font): value is BundledFont {
  return typeof value === "string";
}
//#endregion
