// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, use, useMemo } from "react";

import type {
  AppColor,
  BundledFont,
  ColorRole,
  Font,
  HexColor,
  ThemeColors,
} from "../constants/theme";
import { FONT_FAMILY, THEMES } from "../constants/theme";
import { isHexColor, withAlpha } from "../utils/color";
import { getFileName, removeFileExtension, toLowerCase } from "../utils/string";

const ThemeContext = createContext<ThemeColors>(THEMES.system.colors);

interface ThemeProviderProps {
  children: React.ReactNode;
  colors?: Partial<Record<ColorRole, HexColor>>;
}

export function ThemeProvider({ children, colors }: ThemeProviderProps) {
  const parentTheme = use(ThemeContext);
  const mergedTheme = useMemo(() => {
    const mergedColors = { ...parentTheme, ...colors };
    return {
      ...mergedColors,
      textMuted: withAlpha(mergedColors.text, 0.75),
    };
  }, [parentTheme, colors]);
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
  return isHexColor(color) ? color : use(ThemeContext)[color];
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
