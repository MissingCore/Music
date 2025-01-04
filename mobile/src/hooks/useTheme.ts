import { useColorScheme } from "react-native";

import { useUserPreferencesStore } from "@/services/UserPreferences";

import { Colors } from "@/constants/Styles";

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
    canvasAlt: Colors.neutral5,
    surface: Colors.neutral10,
    onSurface: Colors.neutral20,
    foreground: Colors.neutral100,
  },
} as const;

/** Returns the dynamic colors determined by the current theme. */
export function useTheme() {
  const deviceTheme = useColorScheme();
  const savedTheme = useUserPreferencesStore((state) => state.theme);

  const currentTheme =
    savedTheme === "system" ? (deviceTheme ?? "light") : savedTheme;

  return Themes[currentTheme];
}
