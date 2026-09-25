// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, use, useMemo } from "react";
import type { ScrollHandlers, SharedValue } from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";

import type { AnimatedLegendListRef } from "~/components/Base/LegendList";
import { useAnimatedLegendListRef } from "~/components/Base/LegendList";

interface ScrollContextInput {
  children: React.ReactNode;
  scrollHandlers?: ScrollHandlers<any>;

  // Get access to these properties on the same level as defining the
  // scroll context provider.
  ref?: AnimatedLegendListRef;
  scrollAmount?: SharedValue<number>;
  scrollableHeight?: SharedValue<number>;
}

interface ScrollContextValue extends Omit<
  ScrollContextInput,
  "children" | "scrollHandlers"
> {
  scrollHandlers: ScrollHandlers<any>;

  scrollRef: AnimatedLegendListRef;
  scrollAmount: SharedValue<number>;
  /**
   * The full height of the scroll container. This is obtained from the
   * `onContentSizeChange` prop on the scroll container.
   */
  scrollableHeight: SharedValue<number>;
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

export function ScrollContextProvider({
  children,
  scrollHandlers,
  ref: _ref,
  scrollAmount: _scrollAmount,
  scrollableHeight: _scrollableHeight,
}: ScrollContextInput) {
  const internalRef = useAnimatedLegendListRef();
  const internalScrollAmount = useSharedValue(0);
  const internalScrollableHeight = useSharedValue(0);

  const ref = _ref ?? internalRef;
  const scrollAmount = _scrollAmount ?? internalScrollAmount;
  const scrollableHeight = _scrollableHeight ?? internalScrollableHeight;

  const value = useMemo<ScrollContextValue>(
    () => ({
      scrollRef: ref,
      scrollAmount,
      scrollableHeight,
      scrollHandlers: {
        ...scrollHandlers,
        onScroll: (e, _ctx) => {
          "worklet";
          if (scrollHandlers?.onScroll) scrollHandlers.onScroll(e, _ctx);
          scrollAmount.set(e.contentOffset.y);
        },
      },
    }),
    [ref, scrollAmount, scrollableHeight, scrollHandlers],
  );

  return <ScrollContext value={value}>{children}</ScrollContext>;
}
