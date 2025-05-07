import type { FlashListProps } from "@shopify/flash-list";
import { FlashList as RawFlashList } from "@shopify/flash-list";
import { forwardRef, useRef } from "react";
import type { FlatListProps, ScrollViewProps } from "react-native";
import {
  FlatList as RNFlatList,
  ScrollView as RNScrollView,
} from "react-native";
import { FlatList as RNASFlatList } from "react-native-actions-sheet";
import { FlashList as RNASFlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
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

const RawAnimatedFlashList = Animated.createAnimatedComponent(RawFlashList);

export const FlashList = forwardRef(function FlashList(props, ref) {
  return <RawFlashList ref={ref} {...ScrollablePresets} {...props} />;
}) as FlashListSignature;

export const AnimatedFlashList = forwardRef(
  function AnimatedFlashList(props, ref) {
    // @ts-expect-error - Ref should be compatible.
    return <RawAnimatedFlashList ref={ref} {...ScrollablePresets} {...props} />;
  },
) as FlashListSignature;

export function useFlashListRef() {
  return useRef<RawFlashList<any>>(null);
}
//#endregion

//#region Sheet Lists
/** `<FlatList />` from `react-native-actions-sheet` with some defaults applied. */
export function SheetsFlatList<T>(props: FlatListProps<T>) {
  return <RNASFlatList {...ScrollablePresets} {...props} />;
}

/** `<FlashList />` from `react-native-actions-sheet` with some defaults applied. */
export function SheetsFlashList<T>(props: FlashListProps<T>) {
  return <RNASFlashList {...ScrollablePresets} {...props} />;
}
//#endregion

//#region Flash Drag List
/** `<FlashDragList />` with some defaults. */
export function FlashDragList<T>(props: FlashDragListProps<T>) {
  return <RawFlashDragList {...ScrollablePresets} {...props} />;
}
//#endregion
