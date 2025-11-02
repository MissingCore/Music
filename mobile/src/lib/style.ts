import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { TailwindTheme } from "~/constants/TailwindTheme";
import { FontFamily } from "~/constants/Styles";
import { toLowerCase } from "~/utils/string";
import type { AccentFont } from "~/stores/Preference/constants";

export type TextColor = `text-${string}` | `text-[${string}]`;

function replaceDefault<T extends string>(arr: T[]) {
  return arr.map((val) => (val === "DEFAULT" ? "" : val));
}

const customTwMerge = extendTailwindMerge({
  override: {
    theme: {
      colors: Object.keys(TailwindTheme.colors),
      borderRadius: replaceDefault(Object.keys(TailwindTheme.borderRadius)),
    },
    classGroups: {
      "font-family": Object.keys(TailwindTheme.fontFamily),
      "font-size": [{ text: Object.keys(TailwindTheme.fontSize) }],
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
