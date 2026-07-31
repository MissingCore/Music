// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { z } from "zod/mini";

import { ZSchema } from "~/modules/form/utils";
import type { ColorRole, HexColor } from "./constants";
import { ColorRoleOptions } from "./constants";

//#region Color
const validHexLength = [3, 5, 6, 8];

/** Normalizes `#RGB` and `#RRGGBB` strings to uppercase `#RRGGBB`. */
export function normalizeHexColor(value: string) {
  let raw = value.trim();
  if (raw[0] !== "#") return null;
  raw = raw.slice(1);
  if (!validHexLength.includes(raw.length)) return null;

  //? Sanitize the 2-digit alpha hex if provided.
  let alphaHex = "FF";
  if (raw.length === 5 || raw.length === 8) {
    if (/^([\da-fA-F]{2})$/.test(raw.slice(-2))) {
      alphaHex = raw.slice(-2).toUpperCase();
    }
    raw = raw.slice(0, -2);
  }

  //? Sanitize 3-digit hex colors.
  const shortMatch = /^([\da-fA-F]{3})$/.exec(raw);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1]!.split("");
    return `#${r}${r}${g}${g}${b}${b}${alphaHex}`.toUpperCase() as HexColor;
  }

  //? Sanitize 6-digit hex colors.
  if (!/^([\da-fA-F]{6})$/.test(raw)) return null;
  return `#${raw.toUpperCase()}${alphaHex}` as HexColor;
}

export const HexColorSchema = z.pipe(
  ZSchema.NonEmptyString,
  z.transform((str, ctx) => {
    const normalized = normalizeHexColor(str);
    if (normalized) return normalized;

    ctx.issues.push({
      code: "invalid_value",
      input: str,
      values: [str],
      message: "Expected a valid hex color.",
    });
    return z.NEVER;
  }),
);

export const ColorRoleZodMap = Object.fromEntries(
  ColorRoleOptions.map((role) => [role, HexColorSchema]),
) as Record<ColorRole, typeof HexColorSchema>;
//#endregion
