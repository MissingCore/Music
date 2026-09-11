// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { Appearance } from "react-native";
import type { PaletteResult as RawPaletteResult } from "react-native-material-palette";
import { createPalette } from "react-native-material-palette";
import { Uniwind } from "uniwind";

import { preferenceStore } from "~/stores/Preference/store";

import type { ColorRole, HexColor } from "../theme/core/constants";
import { Themes } from "../theme/core/constants";
import { hexToHSV, hsvToHex } from "../theme/helpers/colorConverter";

type PaletteKeys = keyof RawPaletteResult;
type PaletteResult = Record<PaletteKeys, HexColor | undefined>;

const UpdatedColorRoles = [
  "primary",
  "primaryDim",
  "secondary",
  "secondaryDim",
] as const satisfies ColorRole[];

const paletteColors = {
  primary: ["muted", "lightMuted", "dominant"],
  secondary: ["lightVibrant", "vibrant", "darkMuted", "dominant"],
} as const satisfies Record<string, PaletteKeys[]>;

/** Updates "Atmosphere" Uniwind theme based on image color or fallback. */
export async function deriveAndSetAtmosphereColors(
  imgSrc: string | null,
  /** If we close the screen before deriving the colors, we shouldn't update Uniwind. */
  abortController: AbortController,
) {
  let palette: PaletteResult | undefined;
  if (imgSrc) {
    try {
      const rawPalette = await createPalette({ uri: imgSrc });
      // Convert the `color` property into a Hex color as `react-native-material-palette`
      // reformates the value returned by the Palette API as rgb/rgba.
      palette = Object.fromEntries(
        Object.entries(rawPalette).map(([key, result]) => [
          key,
          result
            ? `#` +
              result.color
                .match(/\d+/g)!
                .slice(0, 3)
                .map((x) => parseInt(x).toString(16).padStart(2, "0"))
                .join("")
            : undefined,
        ]),
      ) as PaletteResult;
    } catch {}
  }

  if (abortController.signal.aborted) return;

  const updatedVariables = getAtmosphereThemeVariables();

  if (palette) {
    // Returns a color that isn't the dominant color if the key isn't `dominant`.
    const getSuitableColor = (keys: readonly PaletteKeys[]) => {
      const dominantColor = palette.dominant;
      for (const key of keys) {
        const color = palette[key];
        if (!color || (key !== "dominant" && color === dominantColor)) continue;
        return color;
      }
      return null;
    };

    for (const role of ["primary", "secondary"] as const) {
      const imgColor = getSuitableColor(paletteColors[role]);
      if (!imgColor) continue;

      const colorAsHSV = hexToHSV(imgColor);
      const dimColor = hsvToHex({ ...colorAsHSV, v: colorAsHSV.v * 0.9 });

      updatedVariables[`--color-${role}`] = imgColor;
      updatedVariables[`--color-${role}Dim`] = dimColor;
    }
  }

  Uniwind.updateCSSVariables("atmosphere", updatedVariables);
}

/** Get the CSS variables used for the "Atmosphere" Uniwind theme. */
function getAtmosphereThemeVariables() {
  const deviceScheme = Appearance.getColorScheme();
  const { theme: savedTheme, activeCustomTheme } = preferenceStore.getState();

  const rawScheme =
    deviceScheme === "light" || deviceScheme === "dark" ? deviceScheme : null;
  const currentScheme =
    savedTheme === "system" ? (rawScheme ?? "light") : savedTheme;

  const customTheme = activeCustomTheme
    ? { scheme: activeCustomTheme.scheme, ...activeCustomTheme.colors }
    : null;
  const currentTheme = customTheme ?? Themes[currentScheme];

  const updatedVariables: Record<string, HexColor> = {};
  UpdatedColorRoles.forEach((role) => {
    updatedVariables[`--color-${role}`] = currentTheme[role];
  });

  return updatedVariables;
}
