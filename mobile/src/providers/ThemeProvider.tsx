import type { Theme } from "@react-navigation/native";
import { ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import { vars } from "nativewind";
import { StatusBar, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useUserPreferencesStore } from "@/services/UserPreferences";

import { Colors } from "@/constants/Styles";

/** Used themed colors through a single Tailwind color via CSS Variables. */
const Themes = {
  light: vars({
    "--color-canvas": "242 242 242", // Colors.neutral95
    "--color-surface": "255 255 255", // Colors.neutral100
    "--color-onSurface": "204 204 204", // Colors.neutral80
    "--color-foreground": "0 0 0", // Colors.neutral0
  }),
  dark: vars({
    "--color-canvas": "0 0 0", // Colors.neutral0
    "--color-surface": "27 29 31", // Colors.neutral10
    "--color-onSurface": "51 51 51", // Colors.neutral20
    "--color-foreground": "255 255 255", // Colors.neutral100
  }),
};

/**
 * Handles switching themes in NativeWind along with updating the status bar
 * text color and the React Navigation theme colors.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const deviceTheme = useColorScheme();
  const savedTheme = useUserPreferencesStore((state) => state.theme);

  const currentTheme =
    savedTheme === "system" ? (deviceTheme ?? "light") : savedTheme;

  const { bottom } = useSafeAreaInsets();
  return (
    <NavigationThemeProvider
      value={currentTheme === "light" ? LightNavTheme : DarkNavTheme}
    >
      <StatusBar
        barStyle={currentTheme === "light" ? "dark-content" : "light-content"}
      />
      <View
        style={[Themes[currentTheme], { paddingBottom: bottom }]}
        className="flex-1 bg-canvas"
      >
        {children}
      </View>
    </NavigationThemeProvider>
  );
}

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
} satisfies Theme;
