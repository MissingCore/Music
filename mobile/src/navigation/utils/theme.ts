import type { Theme } from "@react-navigation/native";
import { DefaultTheme } from "@react-navigation/native";
import { useMemo } from "react";

import { usePreferenceStore } from "~/stores/Preference/store";

import { Colors } from "~/constants/Styles";
import { useCurrentTheme } from "~/modules/theme/hooks";

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
  const customTheme = usePreferenceStore((s) => s.activeCustomTheme);

  const CustomNavTheme = useMemo(() => {
    if (!customTheme) return null;
    const { colors, scheme } = customTheme;
    return {
      dark: scheme === "dark",
      colors: {
        primary: colors.primary,
        background: colors.surface,
        card: colors.surface,
        text: colors.onSurface,
        border: colors.surface,
        notification: colors.primary,
      },
      fonts: DefaultTheme.fonts,
    };
  }, [customTheme]);

  return useMemo(
    () =>
      currentTheme === "custom" && CustomNavTheme
        ? CustomNavTheme
        : currentTheme === "light"
          ? LightNavTheme
          : DarkNavTheme,
    [CustomNavTheme, currentTheme],
  );
}
