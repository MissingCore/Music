import { toLowerCase } from "~/utils/string";
import type { CustomFont } from "./schema";
import type { BundledFont, Font } from "./constants";
import { FontFamily } from "./constants";

export function isBundledFont(
  value: BundledFont | CustomFont,
): value is BundledFont {
  return typeof value === "string";
}

export function getFontDisplayName(font: Font) {
  return isBundledFont(font) ? font : font.displayName;
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
    if (fileName) return fileName.split(".").slice(0, -1).join(".");
    return getBundledFontFamily(
      options?.headline ? "NType" : "Roboto",
      options,
    );
  }
  return getBundledFontFamily(font, options);
}
