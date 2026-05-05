import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";

import type { AppColor } from "~/lib/style";
import { isHexColor } from "~/lib/style";
import { Themes } from "./constants";

//#region Hooks
/** Returns if we're using light or dark theme. */
export function useCurrentTheme() {
  const deviceTheme = useColorScheme();
  const savedTheme = usePreferenceStore((s) => s.theme);

  //? Restore the old behavior where we got `null` instead of `unspecified`.
  const rawTheme = deviceTheme === "unspecified" ? null : deviceTheme;
  return savedTheme === "system" ? (rawTheme ?? "light") : savedTheme;
}

/** Returns the dynamic colors determined by the current theme. */
export function useTheme() {
  const currentTheme = useCurrentTheme();
  return useMemo(() => Themes[currentTheme], [currentTheme]);
}

/** Returns a singular color. */
export function useColor(
  wantedColor: AppColor | undefined,
  fallback: AppColor,
) {
  const theme = useTheme();

  let color = isHexColor(fallback) ? fallback : theme[fallback];
  if (wantedColor)
    color = isHexColor(wantedColor) ? wantedColor : theme[wantedColor];
  return color;
}
//#endregion
