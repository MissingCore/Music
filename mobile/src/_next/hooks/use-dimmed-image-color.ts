// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { colord } from "colord";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { createPalette } from "react-native-material-palette";

import { useColor } from "~/_next/context/theme-context";

import type { HexColor } from "~/_next/constants/theme";
import { BoundedMap } from "~/_next/utils/bounded-map";
import { clampBrightness } from "~/_next/utils/color";

const ColorCache = new BoundedMap<string, HexColor>(100);

/** Returns the dominant color of an image, clamped to a brightness of 75%. */
export function useDimmedImageColor(src: unknown) {
  const background = useColor("background");

  const fallbackColor = useMemo(
    () => clampBrightness(colord(background)).toHex() as HexColor,
    [background],
  );
  const [color, setColor] = useState<HexColor>();

  const resetColor = useEffectEvent(() =>
    setColor(clampBrightness(colord(background)).toHex() as HexColor),
  );

  useEffect(() => {
    if (typeof src !== "string" || ColorCache.has(src)) return;
    let cancelled = false;

    createPalette({ uri: src })
      .then(({ dominant }) => {
        if (!dominant?.color) throw new Error("No dominant color found.");
        const dimmedColor = clampBrightness(
          colord(dominant.color),
        ).toHex() as HexColor;
        ColorCache.set(src, dimmedColor);
        if (!cancelled) setColor(dimmedColor);
      })
      .catch(() => {
        if (!cancelled) resetColor();
      });

    return () => {
      cancelled = true;
    };
  }, [src]);

  return typeof src !== "string"
    ? fallbackColor
    : (ColorCache.get(src) ?? color ?? fallbackColor);
}
