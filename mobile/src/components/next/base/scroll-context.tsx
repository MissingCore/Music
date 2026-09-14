// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, use, useMemo } from "react";
import type { ScrollHandler, SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";

import type { AnimatedLegendListRef } from "~/components/Base/LegendList";
import { useAnimatedLegendListRef } from "~/components/Base/LegendList";

interface ScrollContextValue {
  scrollRef: AnimatedLegendListRef;
  scrollAmount: SharedValue<number>;
  /**
   * The full height of the scroll container. This is obtained from the
   * `onContentSizeChange` prop on the scroll container.
   */
  scrollableHeight: SharedValue<number>;
  onScroll: ScrollHandler<any>;
}

const ScrollContext = createContext<ScrollContextValue>(null as never);

export function useScrollContext() {
  const context = use(ScrollContext);
  if (!context)
    throw new Error(
      "`useScrollContext` must be used inside of a `ScrollContextProvider`.",
    );
  return context;
}

export function ScrollContextProvider(props: { children: React.ReactNode }) {
  const ref = useAnimatedLegendListRef();
  const scrollAmount = useSharedValue(0);
  const scrollableHeight = useSharedValue(0);

  const value = useMemo<ScrollContextValue>(
    () => ({
      scrollRef: ref,
      scrollAmount,
      scrollableHeight,
      onScroll: (e, _ctx) => {
        "worklet";
        scrollAmount.set(e.contentOffset.y);
      },
    }),
    [ref, scrollAmount, scrollableHeight],
  );

  return <ScrollContext value={value}>{props.children}</ScrollContext>;
}
