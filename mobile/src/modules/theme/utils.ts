import { Uniwind } from "uniwind";
import { Appearance } from "react-native";

import type { CustomTheme } from "./constants";

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
