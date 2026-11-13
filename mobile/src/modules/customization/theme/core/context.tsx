// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { colord } from "colord";
import {
  createContext,
  use,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { createPalette } from "react-native-material-palette";

import { usePreferenceStore } from "~/stores/Preference/store";

import { clampBrightness, isHexColor } from "~/utils/color";
import type { AppColor, HexColor, ResolvedTheme } from "./constants";
import { SystemTheme, Themes } from "./constants";

const ThemeContext = createContext<ResolvedTheme>(SystemTheme);

type ThemeProviderProps = {
  children: React.ReactNode;
  theme?: Partial<ResolvedTheme>;
};

//#region Subtree Provider
/** Can be used to partially update the theme values in a given subtree. */
export function ThemeProvider(props: ThemeProviderProps) {
  const parentTheme = use(ThemeContext);
  const theme = useMemo(
    () => ({ ...parentTheme, ...props.theme }),
    [parentTheme, props.theme],
  );
  return <ThemeContext value={theme}>{props.children}</ThemeContext>;
}
//#endregion

//#region Root Provider
/** Theme provider to define at the top-level. */
export function RootThemeProvider(props: { children: React.ReactNode }) {
  const deviceScheme = useColorScheme();
  const preferredTheme = usePreferenceStore((state) => state.theme);
  const customTheme = usePreferenceStore((state) => state.activeCustomTheme);

  const theme = useMemo((): ResolvedTheme => {
    if (customTheme) {
      return { scheme: customTheme.scheme, ...customTheme.colors };
    }

    const scheme =
      preferredTheme === "system" ? (deviceScheme ?? "light") : preferredTheme;
    return Themes[scheme];
  }, [customTheme, deviceScheme, preferredTheme]);

  return <ThemeProvider theme={theme}>{props.children}</ThemeProvider>;
}
//#endregion

//#region Hooks
export function useTheme() {
  return use(ThemeContext);
}

/**
 * Returns the specified hex color from either the provided hex color or
 * color role. Defaults to `onSurface`.
 */
export function useColor(color: AppColor = "onSurface") {
  return isHexColor(color) ? color : use(ThemeContext)[color];
}

const DominantColorCache: Record<string, HexColor> = {};

/** Returns the dominant color of an image after being tinted darker. */
export function useTintedDominantColor(imgSrc: unknown) {
  const { surface } = useTheme();
  const [color, setColor] = useState<HexColor>(
    () => clampBrightness(colord(surface)).toHex() as HexColor,
  );

  const resetColor = useEffectEvent(() =>
    setColor(clampBrightness(colord(surface)).toHex() as HexColor),
  );

  useEffect(() => {
    if (typeof imgSrc !== "string" || DominantColorCache[imgSrc]) return;
    createPalette({ uri: imgSrc })
      .then(({ dominant }) => {
        if (!dominant?.color) throw new Error("No dominant color found.");
        const tintedColor = clampBrightness(
          colord(dominant.color),
        ).toHex() as HexColor;
        setColor(tintedColor);
        DominantColorCache[imgSrc] = tintedColor;
      })
      .catch(resetColor);
  }, [imgSrc]);

  return typeof imgSrc !== "string"
    ? color
    : (DominantColorCache[imgSrc] ?? color);
}
//#endregion
