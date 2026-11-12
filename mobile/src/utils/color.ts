// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { colord } from "colord";

export function isValidHexColor(value: string) {
  return value.startsWith("#") && colord(value).isValid();
}

export function withAlpha(color: string, alpha: number) {
  return colord(color).alpha(alpha).toHex().toUpperCase();
}

export function hexToAlpha(hex: string) {
  if (hex.length !== 2 || !/^[\da-f]{2}$/i.test(hex)) return 1;
  return +colord(`#000000${hex}`).alpha().toFixed(2);
}

export function alphaToHex(alpha: number) {
  if (alpha < 0 || alpha >= 1) return "FF";
  return colord("#000000").alpha(alpha).toHex().slice(-2).toUpperCase();
}
