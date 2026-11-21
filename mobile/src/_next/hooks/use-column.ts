// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import type { LayoutOption } from "~/stores/ViewPreference/constants";

interface ColumnOptions {
  /** Minimum number of columns to return. */
  minCols?: number;
  /** Unusable space to be deducted from the screen width. */
  gutters?: number;
  /** Gap between columns. */
  gap?: number;
}

/** Returns the column count and width for the available screen space. */
export function useColumn(minWidth: number, opts?: ColumnOptions) {
  const availableWidth = useWindowDimensions().width - (opts?.gutters ?? 32);

  const minCols = opts?.minCols ?? 1;
  const gap = opts?.gap ?? 6;

  return useMemo(() => {
    const count = Math.max(
      minCols,
      Math.floor((availableWidth + gap) / (minWidth + gap)),
    );
    const width = (availableWidth - gap * (count - 1)) / count;

    return { count, width };
  }, [minWidth, minCols, gap, availableWidth]);
}

//#region useLayoutColumn
const DEFAULT_LAYOUT_OPTS: Record<LayoutOption, ColumnOptions> = {
  compactGrid: { minCols: 3 },
  grid: { minCols: 2 },
  list: { minCols: 1 },
};

/** Returns column count + width based on user preference on layout sizes. */
export function useLayoutColumn(layout: LayoutOption) {
  const minWidth = useViewPreferenceStore((s) => s[`${layout}Size`]);
  return useColumn(minWidth, DEFAULT_LAYOUT_OPTS[layout]);
}
//#endregion
