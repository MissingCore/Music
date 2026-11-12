// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { colord } from "colord";

import type { HexColor } from "../core/constants";

export function hexToHSV(hex: HexColor) {
  const { h, s, v } = colord(hex).toHsv();
  return { h, s: s / 100, v: v / 100 };
}

export function hsvToHex(hsv: { h: number; s: number; v: number }): HexColor {
  return colord({ h: hsv.h, s: hsv.s * 100, v: hsv.v * 100 })
    .toHex()
    .toUpperCase() as HexColor;
}
