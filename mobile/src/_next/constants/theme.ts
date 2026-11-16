// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { isSystemDarkMode } from "@missingcore/native-utils";

//#region Colors
export type HexColor = `#${string}`;

export const ColorSchemeOptions = ["light", "dark"] as const;
export type ColorScheme = (typeof ColorSchemeOptions)[number];

export const DefaultThemeOptions = [...ColorSchemeOptions, "system"] as const;
export type DefaultTheme = (typeof DefaultThemeOptions)[number];

export const ColorRoleOptions = [
  "background",
  "surface",
  "text",
  "accent",
  "secondary",
] as const;
export type ColorRole = (typeof ColorRoleOptions)[number];

export const DerivedColorRoleOptions = ["textMuted"] as const;
export type DerivedColorRole = (typeof DerivedColorRoleOptions)[number];

export type AppColor = ColorRole | DerivedColorRole | HexColor;
export type ThemeColors = Record<ColorRole | DerivedColorRole, HexColor>;
export type Theme = { scheme: ColorScheme; colors: ThemeColors };

const LIGHT_THEME: Theme = {
  scheme: "light",
  colors: {
    background: "#F2F2F2",
    surface: "#FFFFFF",
    text: "#000000",
    textMuted: "#000000BF", // 75% opacity
    accent: "#D71921",
    secondary: "#FFC700",
  },
};

const DARK_THEME: Theme = {
  scheme: "dark",
  colors: {
    background: "#000000",
    surface: "#1C1C1C",
    text: "#FFFFFF",
    textMuted: "#FFFFFFBF", // 75% opacity
    accent: "#D71921",
    secondary: "#FFC700",
  },
};

export const THEMES: Record<DefaultTheme, Theme> = {
  light: LIGHT_THEME,
  dark: DARK_THEME,
  system: isSystemDarkMode ? DARK_THEME : LIGHT_THEME,
};
//#endregion

//#region Fonts
export const FONT_FAMILY = {
  geist: "Geist-Regular",
  geistMedium: "Geist-Medium",
  geistMono: "GeistMono-Regular",
  geistMonoMedium: "GeistMono-Medium",

  ndot: "Ndot-77_JP_Extended",
  ntype: "NType82-Regular",
  ntypeHeadline: "NType82-Headline",

  system: "System",
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 20,
  xl: 24,
  "4xl": 36,
} as const;
export type FontSize = keyof typeof FONT_SIZE;

export const BundledFontOptions = [
  "NDot",
  "NType",
  "Geist",
  "Geist Mono",
  "System",
] as const;

export type BundledFont = (typeof BundledFontOptions)[number];
export type CustomFont = { id: string; name: string; uri: string };

export type Font = BundledFont | CustomFont;
//#endregion
