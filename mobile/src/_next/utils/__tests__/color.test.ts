// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { colord } from "colord";

import { adjustLightness, clampBrightness } from "../color";

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

describe("clampBrightness", () => {
  test("supports a custom maximum brightness", () => {
    expect(clampBrightness(colord("#FFF"), 0.5).brightness()).toBe(0.5);
  });

  test("does not darken a color already below the threshold", () => {
    const color = colord("#000");

    expect(clampBrightness(color).brightness()).toBe(color.brightness());
  });
});
