// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, use, useMemo } from "react";

import type {
  AppColor,
  BundledFont,
  ColorRole,
  ColorScheme,
  Font,
  HexColor,
  Theme,
} from "~/_next/constants/theme";
import { FONT_FAMILY, THEMES } from "~/_next/constants/theme";
import { isHexColor, withAlpha } from "~/_next/utils/color";
import {
  getFileName,
  removeFileExtension,
  toLowerCase,
} from "~/_next/utils/string";

const ThemeContext = createContext<Theme>(THEMES.system);

interface ThemeProviderProps {
  children: React.ReactNode;
  scheme?: ColorScheme;
  colors?: Partial<Record<ColorRole, HexColor>>;
  fonts?: Partial<Theme["fonts"]>;
}

export function ThemeProvider({
  children,
  scheme,
  colors,
  fonts,
}: ThemeProviderProps) {
  const parentTheme = use(ThemeContext);
  const mergedTheme = useMemo(() => {
    const mergedColors = { ...parentTheme.colors, ...colors };
    return {
      scheme: scheme ?? parentTheme.scheme,
      colors: {
        ...mergedColors,
        textMuted: withAlpha(mergedColors.text, 0.75),
        border: withAlpha(mergedColors.text, 0.25),
      },
      fonts: {
        ...parentTheme.fonts,
        ...fonts,
      },
    };
  }, [parentTheme, scheme, colors, fonts]);
  return <ThemeContext value={mergedTheme}>{children}</ThemeContext>;
}

//#region Hooks
export function useTheme() {
  return use(ThemeContext);
}

/**
 * Returns the specified hex color from either the provided hex color or
 * color role. Defaults to `text`.
 */
export function useColor(color: AppColor) {
  const colors = use(ThemeContext).colors;
  return isHexColor(color) ? color : colors[color];
}
//#endregion

//#region Helpers
export function getFont(
  font: Font,
  options?: { bold?: boolean; headline?: boolean },
) {
  let usedFont = font as BundledFont;
  if (typeof font === "object") {
    const fontName = removeFileExtension(getFileName(font.uri) ?? "");
    if (!!fontName) return fontName;
    usedFont = options?.headline ? "NType" : "Geist";
  }

  const fontCode =
    usedFont === "Geist Mono" ? "geistMono" : toLowerCase(usedFont);

  if ((options?.headline || options?.bold) && font === "NType") {
    return FONT_FAMILY.ntypeHeadline;
  } else if (
    options?.bold &&
    (fontCode === "geist" || fontCode === "geistMono")
  ) {
    return FONT_FAMILY[`${fontCode}Medium`];
  }

  return FONT_FAMILY[fontCode];
}
//#endregion
