// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { HexColor } from "../core/constants";

/** Determine if white or black looks better over the specified color. */
export function getContrastColor(hex: HexColor) {
  const cleanHex = hex.replace("#", "");

  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((char) => char + char)
          .join("")
      : cleanHex;

  // Extract RGB values
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  // Calculate YIQ brightness
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;

  // Return black for light backgrounds, white for dark backgrounds
  return yiq >= 128 ? "black" : "white";
}

export function hexToHSV(hex: HexColor) {
  const [r, g, b] = hex
    .replace("#", "")
    .match(/.{1,2}/g)! // Split by every 2 characters.
    .map((hex) => parseInt(hex, 16) / 255) as [number, number, number];

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;

  const h =
    delta === 0
      ? 0
      : max === r
        ? 60 * (((g - b) / delta) % 6)
        : max === g
          ? 60 * ((b - r) / delta + 2)
          : 60 * ((r - g) / delta + 4);
  const hue = h < 0 ? h + 360 : h;
  const saturation = max === 0 ? 0 : delta / max;
  const valueV = max;

  return { h: hue, s: saturation, v: valueV };
}

export function hsvToHex(hsv: { h: number; s: number; v: number }): HexColor {
  const { h, s, v } = hsv;
  const hh = ((h % 360) + 360) % 360; // normalize
  const c = v * s;
  const hp = hh / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hp >= 0 && hp < 1) {
    r1 = c;
    g1 = x;
  } else if (hp < 2) {
    r1 = x;
    g1 = c;
  } else if (hp < 3) {
    g1 = c;
    b1 = x;
  } else if (hp < 4) {
    g1 = x;
    b1 = c;
  } else if (hp < 5) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const m = v - c;
  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);

  const toHex = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
