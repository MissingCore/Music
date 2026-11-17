// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { LegendListRef as RawLegendListRef } from "@legendapp/list/react-native";
import type { AnimatedLegendListProps } from "@legendapp/list/reanimated";
import { AnimatedLegendList } from "@legendapp/list/reanimated";
import type { AnimatedRef } from "react-native-reanimated";
import { withUniwind } from "uniwind";

type LegendListSignature = <T>(props: LegendListProps<T>) => React.JSX.Element;

export type LegendListRef = AnimatedRef<RawLegendListRef>;

export type LegendListProps<T = any> = Omit<
  Omit<AnimatedLegendListProps<T>, "ref">,
  "data"
> & { ref?: LegendListRef; data?: readonly T[] };

const WrappedAnimatedLegendList = withUniwind(
  AnimatedLegendList,
) as LegendListSignature;

export function LegendList<T>(props: LegendListProps<T>) {
  return (
    <WrappedAnimatedLegendList
      key={`list-with-${props.numColumns}-cols_${props.estimatedItemSize}-size`}
      maintainVisibleContentPosition={false}
      showsHorizontalScrollIndicator={false}
      showsVerticalScrollIndicator={false}
      recycleItems
      {...props}
    />
  );
}
