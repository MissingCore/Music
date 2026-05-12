import { toLowerCase } from "~/utils/string";
import type { BundledFont } from "./constants";
import { FontFamily } from "./constants";

/**
 * Returns the correct font used from the codes used to determine the
 * accent & primary font used.
 */
export function getFont(
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
