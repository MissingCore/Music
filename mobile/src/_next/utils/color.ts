// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { Colord } from "colord";
import { colord } from "colord";

import type { HexColor } from "~/_next/constants/theme";

/**
 * Converts color to HSL and adjusts the lightness.
 *
 * Enforces minimum lightness of 25% when adjusting dark colors.
 */
export function adjustLightness(color: Colord, amount = 10) {
  const { h, s, l } = color.toHsl();
  let nextLightness = l > 50 ? l - amount : l + amount;
  if (l <= 50 && nextLightness < 25) nextLightness = 25;
  return colord({ h, s, l: nextLightness });
}

export function isHexColor(value?: string): value is HexColor {
  return (
    value !== undefined && value.startsWith("#") && colord(value).isValid()
  );
}

export function withAlpha(color: string, alpha: number): HexColor {
  return colord(color).alpha(alpha).toHex().toUpperCase() as HexColor;
}

/** Sets the max brightness of a color to a specific percentage. Defaults to `75%`. */
export function clampBrightness(color: Colord, to = 0.75) {
  return color.isLight()
    ? color.darken(Math.max(0, color.brightness() - to))
    : color;
}
