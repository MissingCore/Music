// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, use, useMemo } from "react";

import type {
  AppColor,
  ColorRole,
  HexColor,
  ThemeColors,
} from "../constants/theme";
import { THEMES } from "../constants/theme";
import { isHexColor, withAlpha } from "../utils/color";

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
export function useColor(color: AppColor = "text") {
  return isHexColor(color) ? color : use(ThemeContext)[color];
}
//#endregion
