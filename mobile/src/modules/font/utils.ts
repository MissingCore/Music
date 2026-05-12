import { loadAsync as loadFontsAsync } from "expo-font";

import { toLowerCase, removeFileExtension } from "~/utils/string";
import type { CustomFont } from "./schema";
import type { BundledFont, Font } from "./constants";
import { FontFamily } from "./constants";

export function areFontEqual(fontA: Font, fontB: Font) {
  if (!isBundledFont(fontA) && !isBundledFont(fontB)) {
    return fontA.id === fontB.id;
  } else if (typeof fontA === typeof fontB) {
    return fontA === fontB;
  }
  return false;
}

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

export function isBundledFont(
  value: BundledFont | CustomFont,
): value is BundledFont {
  return typeof value === "string";
}

export function loadCustomFonts(fonts: CustomFont[]) {
  const customFontEntries = fonts
    .map((font) => {
      const fileName = font.uri.split("/").at(-1);
      if (!fileName) return undefined;
      return [removeFileExtension(fileName), font.uri] as const;
    })
    .filter((entry) => entry !== undefined);
  return loadFontsAsync(Object.fromEntries(customFontEntries));
}
