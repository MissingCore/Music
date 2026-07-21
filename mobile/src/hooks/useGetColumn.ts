// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";

//#region useGetColumn
/** Determine the width a column will take up based on parameters. */
export function useGetColumn({
  minCols,
  minWidth,
  gap,
  percentDeduction = 0,
}: ColumnParameters & {
  /** Percentage removed from global "width" in calculations. */
  percentDeduction?: number;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const width = screenWidth * (1 - percentDeduction);
  return useMemo(
    () => calculateColumnParameters(width, { minCols, minWidth, gap }),
    [width, minCols, minWidth, gap],
  );
}
//#endregion

//#region useGridLayoutConfig
/** Get column configurations for "cards" in a grid. */
export function useGridLayoutConfig(args?: ColumnOptions) {
  const { width, minWidth, gap } = useDerviedArgs(args);
  return useMemo(
    () => calculateColumnParameters(width, { minCols: 2, minWidth, gap }),
    [width, minWidth, gap],
  );
}
//#endregion

//#region useHorizontalListLayoutConfig
/** Get column configurations for "items" in a horizontal list. */
export function useHorizontalListLayoutConfig(
  args?: Pick<ColumnOptions, "percentDeduction">,
) {
  const { width } = useDerviedArgs(args);
  return useMemo(
    () =>
      calculateColumnParameters(width, { minCols: 1, minWidth: 100, gap: 0 }),
    [width],
  );
}
//#endregion

//#region useListLayoutConfig
/** Get column configurations for "items" in a list. */
export function useListLayoutConfig(
  args?: Pick<ColumnOptions, "percentDeduction">,
) {
  const { width, gap } = useDerviedArgs(args);
  return useMemo(
    () => calculateColumnParameters(width, { minCols: 1, minWidth: 272, gap }),
    [width, gap],
  );
}
//#endregion

//#region Preset
export const ColumnPresets = {
  compactGridLayout: { minCols: 3, minWidth: 72, gap: 8 },
} as const satisfies Record<string, ColumnParameters>;
//#endregion

//#region Internal Helpers
/** Gap used to space items. */
const CONTENT_GAP = 8;
/** Space reserved for horizontal margin on screen. */
const SCREEN_GUTTERS = 32;

interface ColumnParameters {
  /** Minimum number of columns to return. */
  minCols: number;
  /** Minimum width of column before we can auto-add more. */
  minWidth: number;
  /** Gap between columns. */
  gap: number;
}

/** Core logic for calculating the number of columns and their width. */
function calculateColumnParameters(
  width: number,
  { minCols, minWidth, gap }: ColumnParameters,
) {
  const initColSize = getColSize(width, minCols, gap);

  // Get the number of excess space used in each column
  const excessSpace = minCols * (initColSize - minWidth);
  // If `excessSpace` is negative or is less than adding another column
  // w/ gap, we do `auto-fill` behavior.
  if (excessSpace <= minWidth + gap)
    return { count: minCols, width: initColSize };
  const newColCount = Math.floor(excessSpace / (minWidth + gap)) + minCols;

  return {
    count: newColCount,
    width: getColSize(width, newColCount, gap),
  };
}

/** Helper for calculating the column size. */
function getColSize(width: number, cols: number, gap: number) {
  return (width - SCREEN_GUTTERS - gap * (cols - 1)) / cols;
}

interface ColumnOptions {
  /** Gap between columns. */
  gap?: number;
  /** Minimum width of column before we can auto-add more. */
  minWidth?: number;
  /** Percentage removed from global "width" in calculations. */
  percentDeduction?: number;
}

/** Derive values to be passed to `calculateColumnParameters()`. */
function useDerviedArgs(args: ColumnOptions = {}) {
  const { width: screenWidth } = useWindowDimensions();
  const gridColumnSize = usePreferenceStore((s) => s.gridColumnSize);

  const width = screenWidth * (1 - (args.percentDeduction || 0));
  const minWidth = args.minWidth ?? gridColumnSize;
  const gap = args.gap ?? CONTENT_GAP;

  return useMemo(() => ({ width, minWidth, gap }), [width, minWidth, gap]);
}
//#endregion
