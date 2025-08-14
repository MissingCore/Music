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
import Animated from "react-native-reanimated";

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
  const [isScrollable, setIsScrollable] = useState(false);

  const handlers = useMemo(
    () => ({
      onLayout: (e: LayoutChangeEvent) => {
        layoutHeight.current = e.nativeEvent.layout.height;
        setIsScrollable(false);
      },
      onContentSizeChange: (_w: number, h: number) => {
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
//#endregion

//#region Flash List
type FlashListProps<T> = RawFlashListProps<T> & {
  ref?: React.Ref<RawFlashList<T>>;
};

type FlashListSignature = <T>(props: FlashListProps<T>) => React.JSX.Element;
const WrappedFlashList = cssInterop(RawFlashList, {
  contentContainerClassName: "contentContainerStyle",
}) as FlashListSignature;

const RawAnimatedFlashList = Animated.createAnimatedComponent(WrappedFlashList);

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

export function AnimatedFlashList<T>(props: FlashListProps<T>) {
  return (
    // @ts-expect-error - Ref should be compatible.
    <RawAnimatedFlashList
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

/** `<FlashDragList />` with some defaults. */
export function FlashDragList<T>(props: FlashDragListProps<T>) {
  return <WrappedFlashDragList {...ScrollablePresets} {...props} />;
}
//#endregion
