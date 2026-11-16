// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { colord } from "colord";

import { adjustTone } from "../color";

describe("adjustTone", () => {
  test("darkens a light color", () => {
    const color = colord("#FFF");

    expect(adjustTone(color).toHex().toUpperCase()).toBe("#E6E6E6");
    expect(adjustTone(color, 0.25).toHex().toUpperCase()).toBe("#BFBFBF");
  });

  test("lightens a dark color", () => {
    const color = colord("#000");

    expect(adjustTone(color).toHex().toUpperCase()).toBe("#1A1A1A");
    expect(adjustTone(color, 0.25).toHex().toUpperCase()).toBe("#404040");
  });
});
