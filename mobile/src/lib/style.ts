import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { BorderRadius, FontFamily, FontSize } from "~/constants/Styles";
import { toLowerCase } from "~/utils/string";
import type { AccentFont } from "~/stores/Preference/constants";

export type TextColor = `text-${string}` | `text-[${string}]`;

function replaceDefault<T extends string>(arr: T[]) {
  return arr.map((val) => (val === "DEFAULT" ? "" : val));
}

const ColorRoles = [
  ...["primary", "primaryDim", "onPrimary", "onPrimaryVariant"],
  ...["secondary", "secondaryDim", "onSecondary", "onSecondaryVariant"],
  ...["error", "onError", "onErrorVariant"],
  ...["surfaceDim", "surface", "surfaceBright"],
  ...[
    "surfaceContainerLowest",
    "surfaceContainerLow",
    "surfaceContainer",
    "surfaceContainerHigh",
  ],
  ...["onSurface", "onSurfaceVariant", "outline", "outlineVariant"],
  ...["inverseSurface", "inverseOnSurface"],
] as const;

export type ColorRole = (typeof ColorRoles)[number];
export type HexColor = `#${string}`;
export type AppColor = ColorRole | HexColor;

const AvailableColors = ["transparent", "red", ...ColorRoles] as const;

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

/**
 * Returns the correct font used from the codes used to determine the
 * accent & primary font used.
 */
export function getFont(font: AccentFont, bold = false) {
  const fontCode = font === "Geist Mono" ? "geistMono" : toLowerCase(font);
  if (
    bold &&
    (fontCode === "geistMono" || fontCode === "roboto" || fontCode === "inter")
  ) {
    return FontFamily[`${fontCode}Medium`];
  }
  return FontFamily[fontCode];
}

/** Determines if a string is a hex color. */
export function isHexColor(color?: string): color is HexColor {
  return color !== undefined && color.startsWith("#");
}
