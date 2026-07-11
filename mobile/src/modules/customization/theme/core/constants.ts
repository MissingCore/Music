// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { isSystemDarkMode } from "@missingcore/native-utils";

import { Colors } from "~/constants/Styles";

//#region Color Scheme
export const ColorSchemeOptions = ["light", "dark"] as const;

export type ColorScheme = (typeof ColorSchemeOptions)[number];
//#endregion

//#region Color Roles
export const ColorRoleOptions = [
  "primary",
  "primaryDim",
  "onPrimary",
  "onPrimaryVariant",
  "secondary",
  "secondaryDim",
  "onSecondary",
  "onSecondaryVariant",
  "error",
  "errorDim",
  "onError",
  "onErrorVariant",
  "surfaceDim",
  "surface",
  "surfaceBright",
  "surfaceContainerLowest",
  "surfaceContainerLow",
  "surfaceContainer",
  "surfaceContainerHigh",
  "surfaceContainerHighest",
  "onSurface",
  "onSurfaceVariant",
  "outline",
  "outlineVariant",
  "inverseSurface",
  "inverseOnSurface",
  "placeholder",
] as const;

export type ColorRole = (typeof ColorRoleOptions)[number];
export type HexColor = `#${string}`;
export type AppColor = ColorRole | HexColor;
/** List of colors which also has a `Variant` color. */
export type VariantColor =
  Extract<ColorRole, `${string}Variant`> extends `${infer Prefix}Variant`
    ? Prefix
    : never;

export type ThemeColors = Record<ColorRole, HexColor>;
//#endregion

//#region Default Themes
export const DefaultThemeOptions = ["light", "dark", "system"] as const;

export type DefaultTheme = (typeof DefaultThemeOptions)[number];
export type ResolvedTheme = ThemeColors & { scheme: ColorScheme };
export type CustomTheme = {
  id: string;
  name: string;
  scheme: ColorScheme;
  colors: ThemeColors;
};

const DefaultThemeBase = {
  primary: Colors.nRed50,
  onPrimary: Colors.neutral100,
  onPrimaryVariant: Colors.neutral90,

  secondary: Colors.yellow50,
  onSecondary: Colors.neutral0,
  onSecondaryVariant: Colors.neutral30,

  error: Colors.red40,
  onError: Colors.neutral100,
  onErrorVariant: Colors.neutral90,
} as const;

export const Themes = {
  light: {
    scheme: "light",
    ...DefaultThemeBase,
    primaryDim: Colors.nRed45,
    secondaryDim: Colors.yellow47,
    errorDim: Colors.red37,

    surfaceDim: Colors.neutral80,
    surface: Colors.neutral95,
    surfaceBright: Colors.neutral95,

    surfaceContainerLowest: Colors.neutral100,
    surfaceContainerLow: Colors.neutral98,
    surfaceContainer: Colors.neutral92,
    surfaceContainerHigh: Colors.neutral85,
    surfaceContainerHighest: Colors.neutral83,

    onSurface: Colors.neutral0,
    onSurfaceVariant: Colors.neutral40,
    outline: Colors.neutral70,
    outlineVariant: Colors.neutral85,

    inverseSurface: Colors.neutral0,
    inverseOnSurface: Colors.neutral100,

    placeholder: Colors.neutral100,
  },
  dark: {
    scheme: "dark",
    ...DefaultThemeBase,
    primaryDim: Colors.nRed40,
    secondaryDim: Colors.yellow45,
    errorDim: Colors.red35,

    surfaceDim: Colors.neutral0,
    surface: Colors.neutral0,
    surfaceBright: Colors.neutral7,

    surfaceContainerLowest: Colors.neutral10,
    surfaceContainerLow: Colors.neutral13,
    surfaceContainer: Colors.neutral15,
    surfaceContainerHigh: Colors.neutral20,
    surfaceContainerHighest: Colors.neutral23,

    onSurface: Colors.neutral100,
    onSurfaceVariant: Colors.neutral70,
    outline: Colors.neutral40,
    outlineVariant: Colors.neutral20,

    inverseSurface: Colors.neutral100,
    inverseOnSurface: Colors.neutral0,

    placeholder: Colors.neutral100,
  },
} as const satisfies Record<ColorScheme, ResolvedTheme>;

/** Returns theme colors based on the system theme on app launch. */
export const SystemTheme = Themes[isSystemDarkMode ? "dark" : "light"];
//#endregion
