import type {
  LegendListProps as RawLegendListProps,
  LegendListRef,
} from "@legendapp/list";
import { LegendList as RawLegendList } from "@legendapp/list";
import { AnimatedLegendList as RawAnimatedLegendList } from "@legendapp/list/reanimated";
import type { FlashListProps as RawFlashListProps } from "@shopify/flash-list";
import { FlashList as RawFlashList } from "@shopify/flash-list";
import { cssInterop } from "nativewind";
import { useMemo, useRef, useState } from "react";
import type {
  FlatListProps,
  LayoutChangeEvent,
  ScrollViewProps,
} from "react-native";
import {
  FlatList as RNFlatList,
  ScrollView as RNScrollView,
} from "react-native";
import type { FlashDragListProps } from "react-native-draglist/dist/FlashList";
import RawFlashDragList from "react-native-draglist/dist/FlashList";
import type { AnimatedRef } from "react-native-reanimated";
import Animated, { useAnimatedRef } from "react-native-reanimated";

/** Presets for scrollview-like components. */
export const ScrollablePresets = {
  overScrollMode: "never",
  showsHorizontalScrollIndicator: false,
  showsVerticalScrollIndicator: false,
} satisfies ScrollViewProps;

/**
 * Returns whether a scrollable container is scrollable (ie: if its content
 * height is greater than the container size).
 */
export function useIsScrollable() {
  const layoutHeight = useRef(0);
  const lastContentSizeChangeHeight = useRef(0);
  const [isScrollable, setIsScrollable] = useState(false);

  const handlers = useMemo(
    () => ({
      onLayout: (e: LayoutChangeEvent) => {
        layoutHeight.current = e.nativeEvent.layout.height;
        //? Encountered a situation where `onLayout` fired again, but
        //? `onContentSizeChange` didn't.
        setIsScrollable(
          lastContentSizeChangeHeight.current > e.nativeEvent.layout.height,
        );
      },
      onContentSizeChange: (_w: number, h: number) => {
        lastContentSizeChangeHeight.current = h;
        setIsScrollable(h > layoutHeight.current && layoutHeight.current !== 0);
      },
    }),
    [],
  );

  return useMemo(() => ({ handlers, isScrollable }), [handlers, isScrollable]);
}

//#region Native Components
export function useFlatListRef() {
  return useRef<RNFlatList>(null);
}

export function FlatList<T>(
  props: FlatListProps<T> & { ref?: React.Ref<RNFlatList> },
) {
  return <RNFlatList {...ScrollablePresets} {...props} />;
}

export function ScrollView(props: ScrollViewProps) {
  return <RNScrollView {...ScrollablePresets} {...props} />;
}

export function AnimatedScrollView(props: ScrollViewProps) {
  return <Animated.ScrollView {...ScrollablePresets} {...props} />;
}
//#endregion

//#region Flash List
type FlashListProps<T> = RawFlashListProps<T> & {
  ref?: React.Ref<RawFlashList<T>>;
};

type FlashListSignature = <T>(props: FlashListProps<T>) => React.JSX.Element;
const WrappedFlashList = cssInterop(RawFlashList, {
  contentContainerClassName: "contentContainerStyle",
}) as FlashListSignature;

export function FlashList<T>(props: FlashListProps<T>) {
  return (
    <WrappedFlashList
      // To prevent `TypeError: Cannot read property 'y' of undefined`
      // crash from a list with `numColumns` and `ListEmptyComponent`.
      key={
        props.data?.length === 0 && props.numColumns !== undefined
          ? `empty-list-with-${props.numColumns}-cols`
          : `non-empty-list-with-${props.numColumns}-cols`
      }
      {...ScrollablePresets}
      {...props}
    />
  );
}

export function useFlashListRef<T = any>() {
  return useRef<RawFlashList<T>>(null);
}
//#endregion

//#region Flash Drag List
const WrappedFlashDragList = cssInterop(RawFlashDragList, {
  contentContainerClassName: "contentContainerStyle",
}) as typeof RawFlashDragList;

export function FlashDragList<T>(props: FlashDragListProps<T>) {
  return <WrappedFlashDragList {...ScrollablePresets} {...props} />;
}
//#endregion

//#region LegendList
type LegendListProps<T> = Omit<RawLegendListProps<T>, "data"> & {
  ref?: React.Ref<LegendListRef>;
  data?: readonly T[];
};

const WrappedLegendList = cssInterop(RawLegendList, {
  contentContainerClassName: "contentContainerStyle",
}) as typeof RawLegendList;

const WrappedAnimatedLegendList = cssInterop(RawAnimatedLegendList, {
  contentContainerClassName: "contentContainerStyle",
}) as typeof RawAnimatedLegendList;

export function LegendList<T>(props: LegendListProps<T>) {
  // @ts-expect-error - List internally handles recieving `undefined`.
  return <WrappedLegendList recycleItems {...ScrollablePresets} {...props} />;
}

export function AnimatedLegendList<T>(props: LegendListProps<T>) {
  return (
    // @ts-expect-error - List internally handles recieving `undefined`.
    <WrappedAnimatedLegendList recycleItems {...ScrollablePresets} {...props} />
  );
}

// @ts-expect-error - Things are compatible.
export type AnimatedLegendListRef = AnimatedRef<LegendListRef>;

export function useLegendListRef() {
  return useRef<LegendListRef>(null);
}

export function useAnimatedLegendListRef() {
  return useAnimatedRef() as unknown as AnimatedLegendListRef;
}
//#endregion
