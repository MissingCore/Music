// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, use, useMemo } from "react";
import type {
  ScrollHandler,
  ScrollHandlers,
  SharedValue,
} from "react-native-reanimated";
import { useSharedValue } from "react-native-reanimated";

import type { AnimatedLegendListRef } from "~/components/Base/LegendList";
import { useAnimatedLegendListRef } from "~/components/Base/LegendList";

interface ProviderProps extends ScrollHandlers<any> {
  children: React.ReactNode;
}

interface ScrollContextValue extends ScrollHandlers<any> {
  scrollRef: AnimatedLegendListRef;
  scrollAmount: SharedValue<number>;
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
  onBeginDrag,
  onEndDrag,
  onScroll,
  onMomentumEnd,
}: ProviderProps) {
  const ref = useAnimatedLegendListRef();
  const scrollAmount = useSharedValue(0);

  const value = useMemo(
    () => ({
      scrollRef: ref,
      scrollAmount,
      onBeginDrag,
      onEndDrag,
      onScroll: ((e, _ctx) => {
        "worklet";
        scrollAmount.set(e.contentOffset.y);
        if (onScroll) onScroll(e, _ctx);
      }) satisfies ScrollHandler<any>,
      onMomentumEnd,
    }),
    [ref, scrollAmount, onBeginDrag, onEndDrag, onScroll, onMomentumEnd],
  );

  return <ScrollContext value={value}>{children}</ScrollContext>;
}
