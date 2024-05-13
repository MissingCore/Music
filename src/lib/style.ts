import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { TailwindTheme } from "@/constants/Themes";

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
      "font-size": Object.keys(TailwindTheme.fontSize),
    },
  },
});

/**
 * @description Combines any number of Tailwind classes nicely.
 * @returns A string containing Tailwind classes.
 */
export function cn(...inputs: ClassValue[]) {
  return customTwMerge(clsx(inputs));
}
