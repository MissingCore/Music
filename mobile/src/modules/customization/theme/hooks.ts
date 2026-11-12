// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { colord } from "colord";
import { useEffect, useMemo, useState } from "react";
import { useColorScheme } from "react-native";
import { createPalette } from "react-native-material-palette";
import { useCSSVariable } from "uniwind";

import { usePreferenceStore } from "~/stores/Preference/store";

import { isHexColor } from "~/utils/color";
import type { AppColor, ColorRole, HexColor } from "./core/constants";
import { Themes } from "./core/constants";

/** Returns if we're using light or dark scheme. */
export function useCurrentScheme() {
  const deviceTheme = useColorScheme();
  const savedTheme = usePreferenceStore((s) => s.theme);
  //? `savedTheme` essentially will store the current color scheme.
  return savedTheme === "system" ? (deviceTheme ?? "light") : savedTheme;
}

/** Returns if we're using light, dark, or custom theme. */
export function useCurrentTheme() {
  const scheme = useCurrentScheme();
  const customTheme = usePreferenceStore((s) => s.activeCustomThemeId);
  return customTheme ? "custom" : scheme;
}

/** Returns the dynamic colors determined by the current theme. */
export function useTheme() {
  const currentTheme = useCurrentTheme();
  const customTheme = usePreferenceStore((s) => s.activeCustomTheme);

  return useMemo(() => {
    if (currentTheme !== "custom" || !customTheme) {
      return Themes[currentTheme === "custom" ? "light" : currentTheme];
    }
    const { scheme, colors } = customTheme;
    return { scheme, ...colors };
  }, [currentTheme, customTheme]);
}

/** Returns a singular color. */
export function useColor(
  wantedColor: AppColor | undefined,
  fallback: ColorRole,
) {
  // This represents a CSS color variable from either `wantedColor` or `fallback`.
  const themeColor = useCSSVariable(
    `--color-${isHexColor(wantedColor) ? fallback : wantedColor || fallback}`,
  ) as HexColor;
  return isHexColor(wantedColor) ? wantedColor : themeColor;
}

//#region useDominantColor
const DominantColorCache: Record<string, HexColor> = {};

/** Returns the dominant color of an image after being tinted darker. */
export function useTintedDominantColor(imgSrc: unknown) {
  const [color, setColor] = useState<HexColor>("#000000");

  useEffect(() => {
    if (typeof imgSrc !== "string" || DominantColorCache[imgSrc]) return;
    createPalette({ uri: imgSrc })
      .then(({ dominant }) => {
        const colorObj = colord(dominant?.color ?? "#000");
        const tintedColor = (
          colorObj.isLight()
            ? //? Set max color brightness to 85%.
              colorObj.darken(Math.max(0, colorObj.brightness() - 0.85)).toHex()
            : colorObj.toHex()
        ) as HexColor;

        setColor(tintedColor);
        DominantColorCache[imgSrc] = tintedColor;
      })
      .catch(() => setColor("#000000"));
  }, [imgSrc]);

  return typeof imgSrc !== "string"
    ? "#000000"
    : (DominantColorCache[imgSrc] ?? color);
}
//#endregion
