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

/**
 * Converts color to HSL and prevents `l` from going above a threshold.
 */
export function clampLightness(color: Colord, to = 75) {
  const { h, s, l } = color.toHsl();
  return l > to ? colord({ h, s, l: to }) : color;
}

export function isHexColor(value?: string): value is HexColor {
  return (
    value !== undefined && value.startsWith("#") && colord(value).isValid()
  );
}

export function withAlpha(color: string, alpha: number): HexColor {
  return colord(color).alpha(alpha).toHex().toUpperCase() as HexColor;
}
