// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type {
  AnimatedRef,
  FlatListPropsWithLayout,
} from "react-native-reanimated";
import Animated, { useAnimatedRef } from "react-native-reanimated";

export type FlatListSignature = <T>(
  props: FlatListProps<T>,
) => React.JSX.Element;

export type FlatListRef<T> = AnimatedRef<Animated.FlatList<T>>;

export type FlatListProps<T> = Omit<
  FlatListPropsWithLayout<T>,
  "ref" | "initialScrollIndex"
> & { ref?: FlatListRef<T> };

export function FlatList<T>(props: FlatListProps<T>) {
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
}

export function useFlatListRef() {
  return useAnimatedRef<Animated.FlatList>();
}
