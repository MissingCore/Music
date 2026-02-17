import { memo, useRef } from "react";
import type { ListRenderItemInfo as RawListRenderItemInfo } from "react-native";
import type {
  AnimatedRef,
  FlatListPropsWithLayout,
} from "react-native-reanimated";
import Animated, { useAnimatedRef } from "react-native-reanimated";

type FlatListSignature = <T>(
  props: FlatListPropsWithLayout<T> & { ref?: JoinedFlatListRef },
) => React.JSX.Element;

type JoinedFlatListRef = FlatListRef | AnimatedFlatListRef;

export type FlatListRef<T = any> = React.RefObject<Animated.FlatList<T> | null>;
export type AnimatedFlatListRef<T = any> = AnimatedRef<Animated.FlatList<T>>;

export type FlatListProps<T = any> = FlatListPropsWithLayout<T>;

export type ListRenderItemInfo<T = any> = RawListRenderItemInfo<T>;

export const FlatList = memo(function FlatList(props) {
  return (
    <Animated.FlatList
      key={`list-with-${props.numColumns}-cols`}
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

export function useAnimatedFlatListRef() {
  return useAnimatedRef<Animated.FlatList>();
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

/** `getItemLayout` function for our standard list items with gap. */
export function getListItemLayout(_: unknown, index: number) {
  // 48px Height + 8px Margin Bottom
  return { length: 56, offset: 56 * index, index };
}

/** `getItemLayout` function for lists with `numColumns`. */
export function getRowItemLayout(rowHeight: number) {
  return (_: unknown, row: number) => {
    return { length: rowHeight, offset: rowHeight * row, index: row };
  };
}
//#endregion
