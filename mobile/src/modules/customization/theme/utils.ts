import { Uniwind } from "uniwind";
import { Appearance } from "react-native";

import { db } from "~/db";
import type { customThemes } from "./core/schema";

import type { CustomTheme, DefaultTheme, HexColor } from "./core/constants";
import { DefaultThemeOptions } from "./core/constants";

export function formatAsCustomTheme(
  entry: typeof customThemes.$inferSelect,
): CustomTheme {
  const { id, name, scheme, ...colors } = entry;
  return { id, name, scheme, colors } as CustomTheme;
}

/** Returns `CustomTheme` object if it exists.  */
export async function getCustomTheme(themeId: string) {
  const customTheme = await db.query.customThemes.findFirst({
    where: (fields, { eq }) => eq(fields.id, themeId),
  });
  if (!customTheme) return null;
  return formatAsCustomTheme(customTheme);
}

export function isDefaultTheme(
  theme: DefaultTheme | (string & {}),
): theme is DefaultTheme {
  return DefaultThemeOptions.includes(theme as DefaultTheme);
}

export function isHexColor(color?: string): color is HexColor {
  return color !== undefined && color.startsWith("#");
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
