import type { Theme } from "@react-navigation/native";
import { DefaultTheme } from "@react-navigation/native";
import { useMemo } from "react";
import { useColorScheme } from "react-native";

import { useUserPreferencesStore } from "~/services/UserPreferences";

import { Colors } from "~/constants/Styles";

//#region Regular
const Themes = {
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
//#endregion

//#region React Navigation
/** Light theme for React Navigation components. */
const LightNavTheme = {
  dark: false,
  colors: {
    primary: Colors.red,
    background: Colors.neutral95,
    card: Colors.neutral95,
    text: Colors.neutral0,
    border: Colors.neutral95,
    notification: Colors.red,
  },
  fonts: DefaultTheme.fonts,
} satisfies Theme;

/** Dark theme for React Navigation components. */
const DarkNavTheme = {
  dark: true,
  colors: {
    primary: Colors.red,
    background: Colors.neutral0,
    card: Colors.neutral0,
    text: Colors.neutral100,
    border: Colors.neutral0,
    notification: Colors.red,
  },
  fonts: DefaultTheme.fonts,
} satisfies Theme;
//#endregion

/** Returns if we're using light or dark theme. */
export function useCurrentTheme() {
  const deviceTheme = useColorScheme();
  const savedTheme = useUserPreferencesStore((state) => state.theme);

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

/** Returns the theme used by React Navigation. */
export function useNavigationTheme() {
  const currentTheme = useCurrentTheme();
  return useMemo(
    () => (currentTheme === "light" ? LightNavTheme : DarkNavTheme),
    [currentTheme],
  );
}
