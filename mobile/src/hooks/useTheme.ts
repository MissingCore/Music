import { useMemo } from "react";
import { useColorScheme } from "react-native";
import { isSystemDarkMode } from "react-native-bootsplash";

import { usePreferenceStore } from "~/stores/Preference/store";

import { Colors } from "~/constants/Styles";

export const Themes = {
  light: {
    theme: "light",
    canvas: Colors.neutral95,
    canvasAlt: Colors.neutral95,
    surface: Colors.neutral100,
    onSurface: Colors.neutral80,
    foreground: Colors.neutral0,
  },
  dark: {
    theme: "dark",
    canvas: Colors.neutral0,
    canvasAlt: Colors.neutral7,
    surface: Colors.neutral10,
    onSurface: Colors.neutral20,
    foreground: Colors.neutral100,
  },
} as const;

/** Returns theme colors based on the system theme on app launch. */
export const SystemTheme = Themes[isSystemDarkMode ? "dark" : "light"];

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
