// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useWindowDimensions } from "react-native";

//#region useGetColumn
export type GCWProps = {
  /**
   * Number of columns we want — if `minWidth` is provided, this becomes
   * the minimum number of columns (ie: CSS Grid `auto-fill` behavior).
   */
  cols: number;
  /** Gap between columns. */
  gap: number;
  /**
   * Any extra width that should be removed from the overall screen size
   * (ie: horizontal margin).
   */
  gutters: number;
  /**
   * **[Optional]** Specifies the minimum column width — if we have enough
   * space, additional columns will be added.
   */
  minWidth?: number;

  /** Amount removed from global "width" in calculations. */
  deduction?: number;
};

/** Determine the width a column will take up based on parameters. */
export function useGetColumn({
  cols,
  gap,
  gutters,
  minWidth,
  deduction = 0,
}: GCWProps) {
  const { width: screenWidth } = useWindowDimensions();

  const width = screenWidth - deduction;
  const initColSize = getColSize(width, cols, gap, gutters);
  // If no `minWidth` is provided, don't do CSS Grid `auto-fill` behavior.
  if (!minWidth) return { count: cols, width: initColSize };
  // Get the number of excess space used in each column
  const excessSpace = cols * (initColSize - minWidth);
  // If `excessSpace` is negative or is less than adding another column
  // w/ gap, we do `auto-fill` behavior.
  if (excessSpace <= minWidth + gap) return { count: cols, width: initColSize };
  const newColCount = Math.floor(excessSpace / (minWidth + gap)) + cols;

  return {
    count: newColCount,
    width: getColSize(width, newColCount, gap, gutters),
  };
}
//#endregion

//#region Preset
export const ColumnPresets = {
  // "Recently Played" & "Current Artist"
  horizontalList: { cols: 1, gap: 0, gutters: 32, minWidth: 100 },
  listLayout: { cols: 1, gap: 8, gutters: 32, minWidth: 300 },
  // `<MediaCard />` & Grid Layout
  gridLayout: { cols: 2, gap: 12, gutters: 32, minWidth: 144 },
  compactGridLayout: { cols: 3, gap: 8, gutters: 32, minWidth: 72 },
};
//#endregion

//#region Internal Helpers
/** `useGetColumnsWidth` helper function for calculating the column size. */
function getColSize(width: number, cols: number, gap: number, gutters: number) {
  return (width - gutters - gap * (cols - 1)) / cols;
}
//#endregion
