// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { Colord } from "colord";
import { colord } from "colord";

import type { HexColor } from "../constants/theme";

/** Darkens color if it's "light" and brightens color if it's "dark". */
export function adjustTone(color: Colord, amount = 0.1) {
  return color.isLight() ? color.darken(amount) : color.lighten(amount);
}

export function isHexColor(value?: string): value is HexColor {
  return (
    value !== undefined && value.startsWith("#") && colord(value).isValid()
  );
}

export function withAlpha(color: string, alpha: number): HexColor {
  return colord(color).alpha(alpha).toHex().toUpperCase() as HexColor;
}
