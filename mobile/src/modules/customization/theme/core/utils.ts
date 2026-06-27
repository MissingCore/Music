// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { z } from "zod/mini";

import { ZSchema } from "~/modules/form/utils";
import type { ColorRole, HexColor } from "./constants";
import { ColorRoleOptions } from "./constants";

//#region Color
/** Normalizes `#RGB` and `#RRGGBB` strings to uppercase `#RRGGBB`. */
export function normalizeHexColor(value: string) {
  const raw = value.trim();
  const shortMatch = /^#([\da-fA-F]{3})$/.exec(raw);
  if (shortMatch) {
    const [r, g, b] = shortMatch[1]!.split("");
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase() as HexColor;
  }

  if (!/^#([\da-fA-F]{6})$/.test(raw)) return null;
  return raw.toUpperCase() as HexColor;
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
