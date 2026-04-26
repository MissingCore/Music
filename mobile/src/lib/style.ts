import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { BorderRadius, FontFamily, FontSize } from "~/constants/Styles";
import { toLowerCase } from "~/utils/string";
import type { Font } from "~/stores/Preference/constants";

//#region Color
// We have some non-standard color roles:
//  - `errorDim`, `onErrorVariant`
//  - If we treat these as "fixed" colors, they're "standard" names:
//    - `primaryDim`, `onPrimaryVariant`, `secondaryDim`, `onSecondaryVariant`
const ColorRoles = [
  ...["primary", "primaryDim", "onPrimary", "onPrimaryVariant"],
  ...["secondary", "secondaryDim", "onSecondary", "onSecondaryVariant"],
  ...["error", "errorDim", "onError", "onErrorVariant"],
  ...["surfaceDim", "surface", "surfaceBright"],
  ...[
    "surfaceContainerLowest",
    "surfaceContainerLow",
    "surfaceContainer",
    "surfaceContainerHigh",
    "surfaceContainerHighest",
  ],
  ...["onSurface", "onSurfaceVariant", "outline", "outlineVariant"],
  ...["inverseSurface", "inverseOnSurface"],
] as const;

export type ColorRole = (typeof ColorRoles)[number];
export type HexColor = `#${string}`;
export type AppColor = ColorRole | HexColor;
/** List of colors which also has a `Variant` color. */
export type VariantColor =
  Extract<ColorRole, `${string}Variant`> extends `${infer Prefix}Variant`
    ? Prefix
    : never;

// Need to include `transparent` as otherwise, things will get merged incorrectly.
const AvailableColors = ["transparent", ...ColorRoles] as const;

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

/** Determines if a string is a hex color. */
export function isHexColor(color?: string): color is HexColor {
  return color !== undefined && color.startsWith("#");
}
//#endregion

//#region Font
/**
 * Returns the correct font used from the codes used to determine the
 * accent & primary font used.
 */
export function getFont(
  font: Font,
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
