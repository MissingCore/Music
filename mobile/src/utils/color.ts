// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { colord } from "colord";

type HexColor = `#${string}`;

export function isHexColor(value?: string): value is HexColor {
  return (
    value !== undefined && value.startsWith("#") && colord(value).isValid()
  );
}

export function hexToHSV(hex: string) {
  const { h, s, v } = colord(hex).toHsv();
  return { h, s: s / 100, v: v / 100 };
}

export function hsvToHex(hsv: { h: number; s: number; v: number }): HexColor {
  return colord({ h: hsv.h, s: hsv.s * 100, v: hsv.v * 100 })
    .toHex()
    .toUpperCase() as HexColor;
}

export function withAlpha(color: string, alpha: number): HexColor {
  return colord(color).alpha(alpha).toHex().toUpperCase() as HexColor;
}

export function hexToAlpha(hex: string) {
  if (hex.length !== 2 || !/^[\da-f]{2}$/i.test(hex)) return 1;
  return +colord(`#000000${hex}`).alpha().toFixed(2);
}

export function alphaToHex(alpha: number) {
  if (alpha < 0 || alpha >= 1) return "FF";
  return colord("#000000").alpha(alpha).toHex().slice(-2).toUpperCase();
}
