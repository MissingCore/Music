// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { colord } from "colord";
import * as v from "valibot";

import { FormSchema } from "~/modules/form/utils";
import type { ColorRole, HexColor } from "./constants";
import { ColorRoleOptions } from "./constants";

//#region Color
/**
 * Normalizes valid short and long hex strings to uppercase `#RRGGBB` or
 * `#RRGGBBAA`.
 */
export function normalizeHexColor(value: string) {
  const raw = value.trim();
  if (raw[0] !== "#") return null;

  const hex = colord(raw);
  if (!hex.isValid()) return null;
  return hex.toHex().toUpperCase() as HexColor;
}

export const HexColorSchema = v.pipe(
  FormSchema.NonEmptyString,
  v.check(
    (str) => normalizeHexColor(str) !== null,
    "Expected a valid hex color.",
  ),
  v.transform((str) => normalizeHexColor(str) as HexColor),
);

export const ColorRoleSchemaMap = Object.fromEntries(
  ColorRoleOptions.map((role) => [role, HexColorSchema]),
) as Record<ColorRole, typeof HexColorSchema>;
//#endregion
