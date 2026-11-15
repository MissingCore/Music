// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { colord } from "colord";

import type { HexColor } from "../constants/theme";

export function isHexColor(value?: string): value is HexColor {
  return (
    value !== undefined && value.startsWith("#") && colord(value).isValid()
  );
}

export function withAlpha(color: string, alpha: number): HexColor {
  return colord(color).alpha(alpha).toHex().toUpperCase() as HexColor;
}
