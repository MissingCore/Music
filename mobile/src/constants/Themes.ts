import type { Theme } from "@react-navigation/native";

import * as Styles from "./Styles";

/** Theme to style React Navigation. */
export const NavigationTheme: Theme = {
  dark: true,
  colors: {
    primary: Styles.Colors.accent500,
    background: Styles.Colors.canvas,
    card: Styles.Colors.canvas,
    text: Styles.Colors.foreground50,
    border: Styles.Colors.canvas,
    notification: Styles.Colors.accent500,
  },
};

/** Theme used in Tailwind configuration. */
export const TailwindTheme = {
  borderRadius: pixelfyUnit(Styles.BorderRadius),
  colors: Styles.Colors,
  fontFamily: Styles.FontFamily,
  fontSize: pixelfyUnit(Styles.FontSize),
} as const;

/** Append `px` to the end of the number. */
function pixelfyUnit<T extends Record<string, number>>(
  theme: T,
): { [TKey in keyof T]: `${T[TKey]}px` } {
  const pixelfiedTheme: Record<string, string> = {};
  Object.keys(theme).forEach((key) => {
    pixelfiedTheme[key] = `${theme[key]}px`;
  });
  return pixelfiedTheme as { [TKey in keyof T]: `${T[TKey]}px` };
}
