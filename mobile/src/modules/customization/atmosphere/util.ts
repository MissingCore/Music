// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { PaletteResult } from "@somesoap/react-native-image-palette";
import { getPalette } from "@somesoap/react-native-image-palette";
import { Appearance } from "react-native";
import { Uniwind } from "uniwind";

import { preferenceStore } from "~/stores/Preference/store";

import { capitalize } from "~/utils/string";
import type { ColorRole, HexColor } from "../theme/core/constants";
import { Themes } from "../theme/core/constants";
import {
  getContrastColor,
  hexToHSV,
  hsvToHex,
} from "../theme/helpers/colorConverter";

const UpdatedColorRoles = [
  "primary",
  "primaryDim",
  "onPrimary",
  "onPrimaryVariant",
  "secondary",
  "secondaryDim",
  "onSecondary",
  "onSecondaryVariant",
] as const satisfies ColorRole[];

const paletteColors = {
  primary: ["muted", "lightMuted", "dominantAndroid"],
  secondary: ["lightVibrant", "vibrant", "darkMuted", "dominantAndroid"],
} as const satisfies Record<string, Array<keyof PaletteResult>>;

const contrastColors = {
  black: { base: "#000000", variant: "#484848" },
  white: { base: "#FFFFFF", variant: "#E3E3E3" },
} as const;

/** Updates "Atmosphere" Uniwind theme based on image color or fallback. */
export async function deriveAndSetAtmosphereColors(
  imgSrc: string | null,
  /** If we close the screen before deriving the colors, we shouldn't update Uniwind. */
  abortController: AbortController,
) {
  let palette: PaletteResult | undefined;
  if (imgSrc) {
    try {
      palette = await getPalette(imgSrc);
    } catch {}
  }

  if (abortController.signal.aborted) return;

  const updatedVariables = getAtmosphereThemeVariables();

  if (palette) {
    // Returns a color that isn't the fallback & not the dominant color
    // (if the key isn't `dominantAndroid`).
    const getSuitableColor = (keys: ReadonlyArray<keyof PaletteResult>) => {
      const dominantColor = palette.dominantAndroid!;
      for (const key of keys) {
        const color = palette[key] as HexColor;
        if (
          color === "#FFFFFF" ||
          (key !== "dominantAndroid" && color === dominantColor)
        )
          continue;
        return color;
      }
      return null;
    };

    for (const role of ["primary", "secondary"] as const) {
      const imgColor = getSuitableColor(paletteColors[role]);
      if (!imgColor) continue;

      const colorAsHSV = hexToHSV(imgColor);
      const dimColor = hsvToHex({ ...colorAsHSV, v: colorAsHSV.v * 0.9 });
      const { base, variant } = contrastColors[getContrastColor(imgColor)];

      updatedVariables[`--color-${role}`] = imgColor;
      updatedVariables[`--color-${role}Dim`] = dimColor;
      updatedVariables[`--color-on${capitalize(role)}`] = base;
      updatedVariables[`--color-on${capitalize(role)}Variant`] = variant;
    }
  }

  Uniwind.updateCSSVariables("atmosphere", updatedVariables);
}

/** Get the CSS variables used for the "Atmosphere" Uniwind theme. */
export function getAtmosphereThemeVariables() {
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
