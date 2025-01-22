import type { FlashListProps } from "@shopify/flash-list";
import { FlashList as SFlashList } from "@shopify/flash-list";
import type { ParseKeys } from "i18next";
import { useMemo } from "react";
import type { FlatListProps, ScrollViewProps } from "react-native";
import {
  FlatList as RNFlatList,
  ScrollView as RNScrollView,
} from "react-native";
import { FlatList as RNASFlatList } from "react-native-actions-sheet";
import { FlashList as RNASFlashList } from "react-native-actions-sheet/dist/src/views/FlashList";
import type { DragListProps } from "react-native-draglist";
import RNDragList from "react-native-draglist";
import type { FlashDragListProps } from "react-native-draglist/dist/FlashList";
import RNFlashDragList from "react-native-draglist/dist/FlashList";

import { ContentPlaceholder } from "./Transition/Placeholder";

//#region Preset Values
/** Presets for scrollview-like components. */
export const ScrollPresets = {
  overScrollMode: "never",
  showsHorizontalScrollIndicator: false,
  showsVerticalScrollIndicator: false,
} satisfies ScrollViewProps;

export type ListEmptyProps = { isPending?: boolean; emptyMsgKey?: ParseKeys };
export type WithListEmptyProps<T> = T & ListEmptyProps;

/** Presets for list-like components (ie: `Flatlist`, `FlashList`). */
export function useListPresets(args?: ListEmptyProps) {
  return useMemo(
    () => ({
      ...ScrollPresets,
      ListEmptyComponent: (
        <ContentPlaceholder
          isPending={args?.isPending}
          errMsgKey={args?.emptyMsgKey}
        />
      ),
    }),
    [args],
  );
}
//#endregion

//#region Native Components
/** `<FlatList />` with some defaults applied. */
export function FlatList<TData>(
  props: WithListEmptyProps<FlatListProps<TData>>,
) {
  const { isPending, emptyMsgKey, ...rest } = props;
  const listPresets = useListPresets({ isPending, emptyMsgKey });
  return <RNFlatList {...listPresets} {...rest} />;
}

/** `<ScrollView />` with some defaults applied. */
export function ScrollView(props: ScrollViewProps) {
  return <RNScrollView {...ScrollPresets} {...props} />;
}
//#endregion

//#region FlashLists
/** `<FlashList />` with some defaults applied. */
export function FlashList<TData>(
  props: WithListEmptyProps<FlashListProps<TData>>,
) {
  const { isPending, emptyMsgKey, ...rest } = props;
  const listPresets = useListPresets({ isPending, emptyMsgKey });
  return <SFlashList {...listPresets} {...rest} />;
}

/** `<FlatList />` from `react-native-actions-sheet` with some defaults applied. */
export function SheetsFlatList<TData>(
  props: WithListEmptyProps<FlatListProps<TData>>,
) {
  const { isPending, emptyMsgKey, ...rest } = props;
  const listPresets = useListPresets({ isPending, emptyMsgKey });
  return <RNASFlatList {...listPresets} {...rest} />;
}

/** `<FlashList />` from `react-native-actions-sheet` with some defaults applied. */
export function SheetsFlashList<TData>(
  props: WithListEmptyProps<FlashListProps<TData>>,
) {
  const { isPending, emptyMsgKey, ...rest } = props;
  const listPresets = useListPresets({ isPending, emptyMsgKey });
  return <RNASFlashList {...listPresets} {...rest} />;
}
//#endregion

//#region DragLists
/** `<DragList />` with some defaults applied. */
export function DragList<TData>(
  props: WithListEmptyProps<DragListProps<TData>>,
) {
  const { isPending, emptyMsgKey, ...rest } = props;
  const listPresets = useListPresets({ isPending, emptyMsgKey });
  return <RNDragList {...listPresets} {...rest} />;
}

/** `<FlashDragList />` with some defaults applied. */
export function FlashDragList<TData>(
  props: WithListEmptyProps<FlashDragListProps<TData>>,
) {
  const { isPending, emptyMsgKey, ...rest } = props;
  const listPresets = useListPresets({ isPending, emptyMsgKey });
  return <RNFlashDragList {...listPresets} {...rest} />;
}
//#endregion
