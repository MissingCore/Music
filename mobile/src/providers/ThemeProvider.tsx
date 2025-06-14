import type { Theme } from "@react-navigation/native";
import { ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import { vars } from "nativewind";
import { useCallback, useState } from "react";
import type { ViewStyle } from "react-native";
import { Appearance, View, useColorScheme } from "react-native";
import { SystemBars } from "react-native-edge-to-edge";

import { useUserPreferencesStore } from "~/services/UserPreferences";

import { Colors } from "~/constants/Styles";

/** Used themed colors through a single Tailwind color via CSS Variables. */
const Themes = {
  light: vars({
    "--color-canvas": "242 242 242", // Colors.neutral95
    "--color-canvasAlt": "242 242 242", // Colors.neutral95
    "--color-surface": "255 255 255", // Colors.neutral100
    "--color-onSurface": "204 204 204", // Colors.neutral80
    "--color-foreground": "0 0 0", // Colors.neutral0
  }),
  dark: vars({
    "--color-canvas": "0 0 0", // Colors.neutral0
    "--color-canvasAlt": "18 18 18", // Colors.neutral7
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
  const iconColor = currentTheme === "light" ? "dark" : "light";

  return (
    <NavigationThemeProvider
      value={currentTheme === "light" ? LightNavTheme : DarkNavTheme}
    >
      <SystemBars style={{ statusBar: iconColor, navigationBar: iconColor }} />
      <View style={Themes[currentTheme]} className="flex-1 bg-canvas">
        {children}
      </View>
    </NavigationThemeProvider>
  );
}

/** Override the theme provided by the `<ThemeProvider />`, using the system theme. */
export function SystemTheme(props: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const getInitialSystemTheme = useCallback(() => {
    setTheme(Appearance.getColorScheme() ?? "light");
    return () => {};
  }, []);

  return (
    <View
      // Use the initial theme as it'll change when we get the values from
      // the user preference store. The order when a callback ref is fired
      // allow us to keep the system theme during the onboarding process.
      ref={getInitialSystemTheme}
      style={[Themes[theme], props.style]}
      className="flex-1 bg-canvas"
    >
      {props.children}
    </View>
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
