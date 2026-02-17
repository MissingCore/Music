import { memo, useRef } from "react";
import type { FlatListPropsWithLayout } from "react-native-reanimated";
import Animated from "react-native-reanimated";

type FlatListSignature = <T>(
  props: FlatListPropsWithLayout<T> & { ref?: FlatListRef },
) => React.JSX.Element;

export type FlatListRef<T = any> = React.RefObject<Animated.FlatList<T> | null>;
export type FlatListProps<T = any> = FlatListPropsWithLayout<T>;

export const FlatList = memo(function FlatList(props) {
  return (
    <Animated.FlatList
      removeClippedSubviews
      overScrollMode="never"
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      windowSize={7} // We don't need that many screens rendered on mount.
      {...props}
    />
  );
}) as FlatListSignature;

export function useFlatListRef() {
  return useRef<Animated.FlatList>(null);
}

//#region Item Layout Calculations
type ItemLayoutContext = {
  itemHeight: number;
  /** A label is considered a string or number in `data` that gets rendered. */
  labelHeight?: number;
  gap?: number;
};

type ItemLayout = { length: number; offset: number; index: number };

/**
 * Calculate at run-time the height of all the items in the list. For
 * simplicity, all items will have the `gap` applied underneath.
 * - We assume the list has a style of `{ marginBottom: -gap }`.
 */
export function calculateItemsLayouts<TData>(
  data: TData[] | null | undefined,
  { itemHeight, labelHeight = 0, gap = 0 }: ItemLayoutContext,
): Record<number, ItemLayout> {
  if (!Array.isArray(data)) return {};
  const layouts: Record<number, ItemLayout> = {};

  let numLabels = 0;
  data.forEach((val, index) => {
    let offset = 0;
    offset += itemHeight * (index - numLabels);
    offset += gap * index; // Add gaps for items + labels.
    if (numLabels > 0) {
      // First label doesn't have extra gap.
      offset += labelHeight * numLabels + gap * (numLabels - 1);
    }

    let currentHeight = gap; // All items have "gap" applied to them.
    if (typeof val === "number" || typeof val === "string") {
      currentHeight += labelHeight;
      if (index > 0) currentHeight += gap;
      numLabels += 1;
    } else {
      currentHeight += itemHeight;
    }

    layouts[index] = { length: currentHeight, offset, index };
  });

  return layouts;
}
//#endregion
