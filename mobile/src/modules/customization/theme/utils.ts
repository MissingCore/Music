import { Uniwind } from "uniwind";
import { Appearance } from "react-native";

import type { customThemes } from "./core/schema";

import type { CustomTheme, DefaultTheme, HexColor } from "./core/constants";
import { DefaultThemeOptions } from "./core/constants";
import { getCustomTheme } from "./core/data";

//#region Loader
export function formatCustomTheme(
  entry: typeof customThemes.$inferSelect,
): CustomTheme {
  const { id, name, scheme, ...colors } = entry;
  return { id, name, scheme, colors } as CustomTheme;
}

/** Returns `CustomTheme` object if it exists.  */
export async function getFormattedCustomTheme(themeId: string) {
  try {
    const customTheme = await getCustomTheme(themeId);
    return formatCustomTheme(customTheme);
  } catch {
    return null;
  }
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
//#endregion

//#region Validators
export function isDefaultTheme(
  theme: DefaultTheme | (string & {}),
): theme is DefaultTheme {
  return DefaultThemeOptions.includes(theme as DefaultTheme);
}

export function isHexColor(color?: string): color is HexColor {
  return color !== undefined && color.startsWith("#");
}
//#endregion
