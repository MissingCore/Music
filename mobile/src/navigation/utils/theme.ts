import type { Theme } from "@react-navigation/native";
import { DefaultTheme } from "@react-navigation/native";
import { useMemo } from "react";

import { useCurrentTheme } from "~/hooks/useTheme";

import { Colors } from "~/constants/Styles";

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

/** Returns the theme used by React Navigation. */
export function useNavigationTheme() {
  const currentTheme = useCurrentTheme();
  return useMemo(
    () => (currentTheme === "light" ? LightNavTheme : DarkNavTheme),
    [currentTheme],
  );
}
