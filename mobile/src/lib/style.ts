import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import { BorderRadius, FontSize } from "~/constants/Styles";
import { FontFamily } from "~/modules/customization/font/core/constants";
import { ColorRoleOptions } from "~/modules/customization/theme/constants";

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

//#region Internal
function replaceDefault<T extends string>(arr: T[]) {
  return arr.map((val) => (val === "DEFAULT" ? "" : val));
}
//#endregion
