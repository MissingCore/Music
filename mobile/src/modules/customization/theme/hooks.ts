import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";

import type { AppColor } from "./core/constants";
import { Themes } from "./core/constants";
import { isHexColor } from "./utils";

/** Returns if we're using light or dark scheme. */
export function useCurrentScheme() {
  const deviceTheme = useColorScheme();
  const savedTheme = usePreferenceStore((s) => s.theme);

  //? Restore the old behavior where we got `null` instead of `unspecified`.
  const rawTheme = deviceTheme === "unspecified" ? null : deviceTheme;
  //? `savedTheme` essentially will store the current color scheme.
  return savedTheme === "system" ? (rawTheme ?? "light") : savedTheme;
}

/** Returns if we're using light, dark, or custom theme. */
export function useCurrentTheme() {
  const scheme = useCurrentScheme();
  const customTheme = usePreferenceStore((s) => s.activeCustomThemeId);
  return customTheme ? "custom" : scheme;
}

/** Returns the dynamic colors determined by the current theme. */
export function useTheme() {
  const currentTheme = useCurrentTheme();
  const customTheme = usePreferenceStore((s) => s.activeCustomTheme);

  return useMemo(() => {
    if (currentTheme !== "custom" || !customTheme) {
      return Themes[currentTheme === "custom" ? "light" : currentTheme];
    }
    const { scheme, colors } = customTheme;
    return { scheme, ...colors };
  }, [currentTheme, customTheme]);
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
