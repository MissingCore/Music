import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { BorderRadius, FontFamily, FontSize } from "~/constants/Styles";
import { toLowerCase } from "~/utils/string";
import type { BundledFont } from "~/modules/font/constants";
import { ColorRoleOptions } from "~/modules/theme/constants";

//#region Color
// Need to include `transparent` as otherwise, things will get merged incorrectly.
const AvailableColors = ["transparent", ...ColorRoleOptions] as const;

const customTwMerge = extendTailwindMerge({
  override: {
    theme: {
      color: AvailableColors,
      radius: replaceDefault(Object.keys(BorderRadius)),
    },
    classGroups: {
      "font-family": Object.keys(FontFamily),
      "font-size": [{ text: Object.keys(FontSize) }],
    },
  },
});

/** Combines any number of Tailwind classes nicely. */
export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
//#endregion

//#region Font
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
//#endregion

//#region Internal
function replaceDefault<T extends string>(arr: T[]) {
  return arr.map((val) => (val === "DEFAULT" ? "" : val));
}
//#endregion
