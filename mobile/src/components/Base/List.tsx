// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { memo, useRef } from "react";
import type { ListRenderItemInfo as RawListRenderItemInfo } from "react-native";
import type {
  AnimatedRef,
  FlatListPropsWithLayout,
} from "react-native-reanimated";
import Animated, { useAnimatedRef } from "react-native-reanimated";

type FlatListSignature = <T>(
  props: FlatListProps<T> & { ref?: JoinedFlatListRef },
) => React.JSX.Element;

type JoinedFlatListRef = FlatListRef | AnimatedFlatListRef;

export type FlatListRef<T = any> = React.RefObject<Animated.FlatList<T> | null>;
export type AnimatedFlatListRef<T = any> = AnimatedRef<Animated.FlatList<T>>;

export type FlatListProps<T = any> = Omit<
  FlatListPropsWithLayout<T>,
  "initialScrollIndex"
>;

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
/** `getItemLayout` function for our standard list items with gap. */
export function getListItemLayout(_: unknown, index: number) {
  // 48px Height + 8px Margin Bottom
  return { length: 56, offset: 56 * index, index };
}
//#endregion
