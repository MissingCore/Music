import type { FlashListProps } from "@shopify/flash-list";
import { FlashList as RawFlashList } from "@shopify/flash-list";
import { cssInterop } from "nativewind";
import { forwardRef, useRef } from "react";
import type { FlatListProps, ScrollViewProps } from "react-native";
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

//#region Native Components
export function useFlatListRef() {
  return useRef<RNFlatList>(null);
}

export const FlatList = forwardRef(function FlatList(props, ref) {
  return <RNFlatList ref={ref} {...ScrollablePresets} {...props} />;
}) as <T>(
  props: FlatListProps<T> & { ref?: React.ForwardedRef<RNFlatList> },
) => React.JSX.Element;

export function ScrollView(props: ScrollViewProps) {
  return <RNScrollView {...ScrollablePresets} {...props} />;
}
//#endregion

//#region Flash List
type FlashListSignature = <T>(
  props: FlashListProps<T> & { ref?: React.ForwardedRef<RawFlashList<T>> },
) => React.JSX.Element;
const WrappedFlashList = cssInterop(RawFlashList, {
  contentContainerClassName: "contentContainerStyle",
}) as FlashListSignature;

const RawAnimatedFlashList = Animated.createAnimatedComponent(WrappedFlashList);

export const FlashList = forwardRef(function FlashList(props, ref) {
  return <WrappedFlashList ref={ref} {...ScrollablePresets} {...props} />;
}) as FlashListSignature;

export const AnimatedFlashList = forwardRef(
  function AnimatedFlashList(props, ref) {
    // @ts-expect-error - Ref should be compatible.
    return <RawAnimatedFlashList ref={ref} {...ScrollablePresets} {...props} />;
  },
) as FlashListSignature;

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
