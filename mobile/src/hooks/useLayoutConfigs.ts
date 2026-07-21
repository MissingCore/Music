// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { useViewPreferenceStore } from "~/stores/ViewPreference/store";

interface ClampOptions {
  /** Percentage removed from global "width" in calculations. */
  percentDeduction?: number;
}

interface ColumnOptions extends ClampOptions {
  /** Minimum number of columns to return. */
  minCols?: number;
  /** Minimum width of column before we can auto-add more. */
  minWidth?: number;
  /** Gap between columns. */
  gap?: number;
}

//#region Layout Config Hooks
/** Get column configurations for "cards" in a compact grid. */
export function useCompactGridLayoutConfig(args: ColumnOptions = {}) {
  return useGetLayoutConfig({ compact: true, ...args, minCols: 3 });
}

/** Get column configurations for "cards" in a grid. */
export function useGridLayoutConfig(args: ColumnOptions = {}) {
  return useGetLayoutConfig({ ...args, minCols: 2 });
}

/** Get column configurations for "cards" in a horizontal list. */
export function useHorizontalListLayoutConfig(args: ClampOptions = {}) {
  return useGetLayoutConfig({ ...args, minWidth: 100, gap: 0 });
}

/** Get column configurations for "items" in a list. */
export function useListLayoutConfig(args?: ClampOptions) {
  return useGetLayoutConfig({ ...args, minWidth: 272 });
}
//#endregion

//#region Internal Helpers
/** Gap used to space items. */
const CONTENT_GAP = 8;
/** Space reserved for horizontal margin on screen. */
const SCREEN_GUTTERS = 32;

/** Helper for calculating the column size. */
function getColSize(width: number, cols: number, gap: number) {
  return (width - SCREEN_GUTTERS - gap * (cols - 1)) / cols;
}

/** Determine the width a column will take up based on parameters. */
function useGetLayoutConfig(args: ColumnOptions & { compact?: boolean }) {
  const { width: screenWidth } = useWindowDimensions();
  const compactGridSize = useViewPreferenceStore((s) => s.compactGridSize);
  const gridSize = useViewPreferenceStore((s) => s.gridSize);

  const width = screenWidth * (1 - (args.percentDeduction || 0));
  const minCols = args.minCols ?? 1;
  const minWidth = args.minWidth ?? (args.compact ? compactGridSize : gridSize);
  const gap = args.gap ?? CONTENT_GAP;

  return useMemo(() => {
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
  }, [width, minCols, minWidth, gap]);
}
//#endregion
