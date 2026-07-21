// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";

interface ColumnOptions {
  /** Minimum width of column before we can auto-add more. */
  minWidth?: number;
  /** Percentage removed from global "width" in calculations. */
  percentDeduction?: number;
}

//#region useGetColumn
/** Determine the width a column will take up based on parameters. */
export function useGetColumn({
  minCols,
  minWidth,
  gap,
  gutters,
  percentDeduction = 0,
}: ColumnParameters & {
  /** Percentage removed from global "width" in calculations. */
  percentDeduction?: number;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const width = screenWidth * (1 - percentDeduction);
  return useMemo(
    () => calculateColumnParameters(width, { minCols, minWidth, gap, gutters }),
    [width, minCols, minWidth, gap, gutters],
  );
}
//#endregion

//#region useGridLayoutConfig
/** Get column configurations for "cards" in a grid. */
export function useGridLayoutConfig(args?: ColumnOptions) {
  const { minWidth: _overrideMinWidth, percentDeduction = 0 } = args || {};

  const { width: screenWidth } = useWindowDimensions();
  const gridColumnSize = usePreferenceStore((s) => s.gridColumnSize);

  const width = screenWidth * (1 - percentDeduction);
  const minWidth = _overrideMinWidth ?? gridColumnSize;

  return useMemo(
    () =>
      calculateColumnParameters(width, {
        ...ColumnPresets.gridLayout,
        minWidth,
      }),
    [width, minWidth],
  );
}
//#endregion

//#region calculateColumnParameters
interface ColumnParameters {
  /** Minimum number of columns to return. */
  minCols: number;
  /** Minimum width of column before we can auto-add more. */
  minWidth: number;
  /** Gap between columns. */
  gap: number;
  /** Space in provided width reserved for horizontal margin. */
  gutters: number;
}

/** Core logic for calculating the number of columns and their width. */
export function calculateColumnParameters(
  width: number,
  { minCols, minWidth, gap, gutters }: ColumnParameters,
) {
  const initColSize = getColSize(width, minCols, gap, gutters);

  // Get the number of excess space used in each column
  const excessSpace = minCols * (initColSize - minWidth);
  // If `excessSpace` is negative or is less than adding another column
  // w/ gap, we do `auto-fill` behavior.
  if (excessSpace <= minWidth + gap)
    return { count: minCols, width: initColSize };
  const newColCount = Math.floor(excessSpace / (minWidth + gap)) + minCols;

  return {
    count: newColCount,
    width: getColSize(width, newColCount, gap, gutters),
  };
}
//#endregion

//#region Preset
export const ColumnPresets = {
  // "Recently Played" & "Current Artist"
  horizontalList: { minCols: 1, minWidth: 100, gap: 0, gutters: 32 },
  listLayout: { minCols: 1, minWidth: 272, gap: 8, gutters: 32 },
  // `<MediaCard />` & Grid Layout
  gridLayout: { minCols: 2, minWidth: 144, gap: 8, gutters: 32 },
  compactGridLayout: { minCols: 3, minWidth: 72, gap: 8, gutters: 32 },
} as const satisfies Record<string, ColumnParameters>;
//#endregion

//#region Internal Helpers
/** Helper for calculating the column size. */
function getColSize(width: number, cols: number, gap: number, gutters: number) {
  return (width - gutters - gap * (cols - 1)) / cols;
}
//#endregion
