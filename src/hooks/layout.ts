import { useWindowDimensions } from "react-native";

type GCWProps = {
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
   * **[Optional]** Specifies the minimum column width — if we have enought
   * space, additional columns will be added.
   */
  minWidth?: number;
};

/** @description Determine the width a column will take up based on parameters. */
export function useGetColumnWidth({ cols, gap, gutters, minWidth }: GCWProps) {
  const { width } = useWindowDimensions();

  const initColSize = getColSize(width, cols, gap, gutters);
  // If no `minWidth` is provided, don't do CSS Grid `auto-fill` behavior.
  if (!minWidth) return initColSize;
  // Get the number of excess space used in each column
  const excessSpace = cols * (initColSize - minWidth);
  const newColCount = Math.floor(excessSpace / (minWidth + gap)) + cols;

  if (newColCount <= cols) return initColSize;
  return getColSize(width, newColCount, gap, gutters);
}

/** @description `useGetColumnsWidth` helper function for calculating the column size. */
function getColSize(width: number, cols: number, gap: number, gutters: number) {
  return (width - gutters - gap * (cols - 1)) / cols;
}
