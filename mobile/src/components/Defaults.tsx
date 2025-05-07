import type { FlashListProps } from "@shopify/flash-list";
import { FlashList as SFlashList } from "@shopify/flash-list";
import { forwardRef, useRef } from "react";
import type { FlatListProps, ScrollViewProps } from "react-native";
import {
  FlatList as RNFlatList,
  ScrollView as RNScrollView,
} from "react-native";
import { FlatList as RNASFlatList } from "react-native-actions-sheet";
import { FlashList as RNASFlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import type { FlashDragListProps } from "react-native-draglist/dist/FlashList";
import RNFlashDragList from "react-native-draglist/dist/FlashList";

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
}) as <TData>(
  props: FlatListProps<TData> & { ref?: React.ForwardedRef<RNFlatList> },
) => React.JSX.Element;

export function ScrollView(props: ScrollViewProps) {
  return <RNScrollView {...ScrollablePresets} {...props} />;
}
//#endregion

//#region Flash Lists
/** `<FlashList />` with some defaults applied. */
export function FlashList<TData>(props: FlashListProps<TData>) {
  return <SFlashList {...ScrollablePresets} {...props} />;
}

/** `<FlatList />` from `react-native-actions-sheet` with some defaults applied. */
export function SheetsFlatList<TData>(props: FlatListProps<TData>) {
  return <RNASFlatList {...ScrollablePresets} {...props} />;
}

/** `<FlashList />` from `react-native-actions-sheet` with some defaults applied. */
export function SheetsFlashList<TData>(props: FlashListProps<TData>) {
  return <RNASFlashList {...ScrollablePresets} {...props} />;
}
//#endregion

//#region Flash Drag List
/** `<FlashDragList />` with some defaults. */
export function FlashDragList<TData>(props: FlashDragListProps<TData>) {
  return <RNFlashDragList {...ScrollablePresets} {...props} />;
}
//#endregion
