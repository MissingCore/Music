// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { colord } from "colord";

import { adjustLightness, clampLightness } from "../color";

describe("adjustLightness", () => {
  test("reduces lightness of a light color", () => {
    const color = colord("#FFF");

    expect(adjustLightness(color).toHsl().l).toBe(color.toHsl().l - 10);
    expect(adjustLightness(color, 25).toHsl().l).toBe(color.toHsl().l - 25);
  });

  test("increases lightness of a dark color", () => {
    const color = colord("#404040");

    expect(adjustLightness(color).toHsl().l).toBe(color.toHsl().l + 10);
    expect(adjustLightness(color, 25).toHsl().l).toBe(color.toHsl().l + 25);
  });

  test("enforces minimum lightness for dark colors", () => {
    const color = colord("#000");
    const color2 = colord("#4D0011");

    expect(adjustLightness(color).toHsl().l).toBe(25);
    expect(adjustLightness(color2, 5).toHsl().l).toBe(25);
  });
});

describe("clampLightness", () => {
  test("clamps lightness of color above threshold", () => {
    expect(clampLightness(colord("#FFFFFF")).toHsl().l).toBe(75);
  });

  test("supports a custom maximum brightness", () => {
    expect(clampLightness(colord("#FFF"), 50).toHsl().l).toBe(50);
  });

  test("does not darken a color already below the threshold", () => {
    const color = colord("#FFFF66");

    expect(clampLightness(color).toHsl().l).toBe(color.toHsl().l);
  });
});
