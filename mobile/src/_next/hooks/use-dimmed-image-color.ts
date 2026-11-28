// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { colord } from "colord";
import { useEffect, useMemo } from "react";
import { createPalette } from "react-native-material-palette";

import { useColor } from "~/_next/context/theme-context";

import type { HexColor } from "~/_next/constants/theme";
import { atom, useAtom } from "~/_next/utils/atom";
import { BoundedMap } from "~/_next/utils/bounded-map";
import { clampLightness } from "~/_next/utils/color";

const colorCacheAtom = atom(new BoundedMap<string, HexColor>(100));
function cacheColor(src: string, color: HexColor) {
  colorCacheAtom.set((data) => {
    const nextData = new BoundedMap(100, data);
    nextData.set(src, color);
    return nextData;
  });
}

/** Returns the dominant color of an image, clamped to a brightness of 75%. */
export function useDimmedImageColor(src: unknown) {
  const background = useColor("background");
  const fallbackColor = useMemo(
    () => clampLightness(colord(background)).toHex() as HexColor,
    [background],
  );
  const cachedColor = useAtom(colorCacheAtom, (data) =>
    typeof src === "string" ? data.get(src) : undefined,
  );

  useEffect(() => {
    if (typeof src !== "string" || colorCacheAtom.get().has(src)) return;

    createPalette({ uri: src })
      .then(({ dominant }) => {
        if (!dominant?.color) throw new Error("No dominant color found.");
        const dimmedColor = clampLightness(colord(dominant.color)).toHex();
        cacheColor(src, dimmedColor as HexColor);
      })
      .catch(() => {});
  }, [src]);

  return typeof src !== "string"
    ? fallbackColor
    : (cachedColor ?? fallbackColor);
}
