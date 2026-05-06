import { Uniwind } from "uniwind";
import { Appearance } from "react-native";

import { db } from "~/db";

import type { CustomTheme, DefaultTheme } from "./constants";
import { DefaultThemeOptions } from "./constants";

/** Returns `CustomTheme` object if it exists.  */
export async function getCustomTheme(themeId: string) {
  const customTheme = await db.query.customThemes.findFirst({
    where: (fields, { eq }) => eq(fields.id, themeId),
  });
  if (!customTheme) return null;
  const { id, name, scheme, ...colors } = customTheme;
  return { id, name, scheme, colors } as CustomTheme;
}

export function isDefaultTheme(
  theme: DefaultTheme | (string & {}),
): theme is DefaultTheme {
  return DefaultThemeOptions.includes(theme as DefaultTheme);
}

export function resolveCustomTheme(theme: CustomTheme) {
  Uniwind.updateCSSVariables(
    "custom",
    Object.fromEntries(
      Object.entries(theme.colors).map(([role, color]) => [
        `--color-${role}`,
        color,
      ]),
    ),
  );
  Uniwind.setTheme("custom");
  Appearance.setColorScheme(theme.scheme);
}
