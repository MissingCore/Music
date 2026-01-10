import { useMemo } from "react";
import { useColorScheme } from "react-native";
import { isSystemDarkMode } from "react-native-bootsplash";

import { usePreferenceStore } from "~/stores/Preference/store";

import { Colors } from "~/constants/Styles";
import type { AppColor } from "~/lib/style";
import { isHexColor } from "~/lib/style";

//#region Theme
export const FixedTheme = {
  primary: Colors.red50,
  primaryDim: Colors.red40,
  onPrimary: Colors.neutral100,
  onPrimaryVariant: Colors.neutral90,

  secondary: Colors.yellow60,
  secondaryDim: Colors.yellow50,
  onSecondary: Colors.neutral0,
  onSecondaryVariant: Colors.neutral20,

  error: Colors.red40,
  onError: Colors.neutral100,
} as const;

export const Themes = {
  light: {
    scheme: "light",
    ...FixedTheme,

    surfaceDim: Colors.neutral85,
    surface: Colors.neutral95,
    surfaceBright: Colors.neutral95,

    surfaceContainerLowest: Colors.neutral100,
    surfaceContainerLow: Colors.neutral98,
    surfaceContainer: Colors.neutral92,
    surfaceContainerHigh: Colors.neutral90,

    onSurface: Colors.neutral0,
    onSurfaceVariant: Colors.neutral20,
    outline: Colors.neutral40,
    outlineVariant: Colors.neutral70,

    inverseSurface: Colors.neutral0,
    inverseOnSurface: Colors.neutral100,
  },
  dark: {
    scheme: "dark",
    ...FixedTheme,

    surfaceDim: Colors.neutral0,
    surface: Colors.neutral0,
    surfaceBright: Colors.neutral5,

    surfaceContainerLowest: Colors.neutral10,
    surfaceContainerLow: Colors.neutral13,
    surfaceContainer: Colors.neutral15,
    surfaceContainerHigh: Colors.neutral20,

    onSurface: Colors.neutral100,
    onSurfaceVariant: Colors.neutral90,
    outline: Colors.neutral70,
    outlineVariant: Colors.neutral40,

    inverseSurface: Colors.neutral100,
    inverseOnSurface: Colors.neutral0,
  },
} as const;

/** Returns theme colors based on the system theme on app launch. */
export const SystemTheme = Themes[isSystemDarkMode ? "dark" : "light"];
//#endregion

//#region Hooks
/** Returns if we're using light or dark theme. */
export function useCurrentTheme() {
  const deviceTheme = useColorScheme();
  const savedTheme = usePreferenceStore((s) => s.theme);

  return useMemo(
    () => (savedTheme === "system" ? (deviceTheme ?? "light") : savedTheme),
    [deviceTheme, savedTheme],
  );
}

/** Returns the dynamic colors determined by the current theme. */
export function useTheme() {
  const currentTheme = useCurrentTheme();
  return useMemo(() => Themes[currentTheme], [currentTheme]);
}

/** Returns a singular color. */
export function useColor(args: { color?: AppColor; fallback: AppColor }) {
  const theme = useTheme();
  let color = isHexColor(args.fallback) ? args.fallback : theme[args.fallback];
  if (args.color)
    color = isHexColor(args.color) ? args.color : theme[args.color];
  return color;
}
//#endregion
