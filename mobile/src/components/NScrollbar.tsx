// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useCallback, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import {
  GestureDetector,
  useLongPressGesture,
  usePanGesture,
  useSimultaneousGestures,
} from "react-native-gesture-handler";
import type { AnimatedRef, SharedValue } from "react-native-reanimated";
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import Animated, {
  ReduceMotion,
  clamp,
  scrollTo,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

interface ScrollbarProps {
  listRef: AnimatedRef<any>;
  listHeight: SharedValue<number>;
  listScrollHeight: SharedValue<number>;
  listScrollAmount: SharedValue<number>;

  scrollbarOffset: { top: number; bottom: number };

  isVisible?: boolean;
  /** Worklet function that's called when the gesture has ended. */
  onEnd?: VoidFunction;
}

const THUMB_SIZE = 48;
const COLLAPSED_THUMB_SIZE = 6;

/** Delay before the scrollbar becomes invisible. */
const HIDE_DELAY = 2000;

export function Scrollbar({
  listRef,
  listHeight,
  listScrollHeight,
  listScrollAmount,
  scrollbarOffset: { top, bottom },
  isVisible = true,
  onEnd,
}: ScrollbarProps) {
  const scrollbarHeight = useSharedValue(0);

  const prevY = useSharedValue(-1);
  const nextScrollPosition = useSharedValue(-1);

  //* How much we can actually scroll.
  const scrollableArea = useDerivedValue(
    () => listScrollHeight.get() - listHeight.get(),
  );

  //* Scales down `listScrollAmount` to fit inside of `scrollbarHeight`.
  const scaledScrollAmount = useDerivedValue(() => {
    const scrollPercent = listScrollAmount.get() / scrollableArea.get();
    return scrollPercent * scrollbarHeight.get();
  });

  //* Scroll to given offset using Reanimated.
  useDerivedValue(() => {
    if (nextScrollPosition.get() === -1) return;
    //? For some reason on the New Architecture, things only work if we set
    //? this to `false`, like in our original implementation in:
    //?   - https://github.com/MissingCore/Music/commit/e9a1ff9b66390928210ff054629b6b7d09e1af6a
    scrollTo(listRef, 0, nextScrollPosition.get(), false);
  });

  //#region Visibility
  const [scrollbarVisible, setScrollbarVisible] = useState(false);
  const isOngoing = useSharedValue(false);
  const isScrollingBuffer = useSharedValue(0); // Boolean field

  //* Keeps the scrollbar visible.
  const persistScrollbar = useCallback(() => {
    "worklet";
    isOngoing.set(true);
    isScrollingBuffer.set(1);
  }, [isOngoing, isScrollingBuffer]);

  //* Start the timer to hide the scrollbar.
  const dismissScrollbar = useCallback(() => {
    "worklet";
    isOngoing.set(false);
    isScrollingBuffer.set(
      withTiming(0, {
        duration: HIDE_DELAY,
        //! See: https://github.com/MissingCore/Music/pull/480
        reduceMotion: ReduceMotion.Never,
      }),
    );
  }, [isOngoing, isScrollingBuffer]);

  //* Show scrollbar if we have at least 2 screens worth of content.
  useDerivedValue(() => {
    const hasEnoughContent = listScrollHeight.get() / listHeight.get() > 2;
    scheduleOnRN(
      setScrollbarVisible,
      isVisible && hasEnoughContent && isScrollingBuffer.get() !== 0,
    );
  });

  //* Show scrollbar when we're scrolling and hide it after a delay
  //* after stopping when the thumb is released.
  useAnimatedReaction(
    () => listScrollAmount.get(),
    (_, prevVal) => {
      if (prevVal === null) return; //? Don't call on "initialization".
      isScrollingBuffer.set(1);
      if (isOngoing.get()) return;
      isScrollingBuffer.set(
        withTiming(0, {
          duration: HIDE_DELAY,
          //! See: https://github.com/MissingCore/Music/pull/480
          reduceMotion: ReduceMotion.Never,
        }),
      );
    },
  );
  //#endregion

  //#region Gestures
  const pressGesture = useLongPressGesture({
    enabled: scrollbarVisible,
    minDuration: 0,
    onActivate: persistScrollbar,
    onDeactivate: dismissScrollbar,
  });

  const scrollGesture = usePanGesture({
    enabled: scrollbarVisible,
    onActivate: ({ absoluteY }) => {
      persistScrollbar();
      prevY.set(absoluteY);
    },
    onUpdate: ({ absoluteY }) => {
      persistScrollbar();
      const changeDelta = absoluteY - prevY.get();
      const clampedScaledPosition = clamp(
        scaledScrollAmount.get() + changeDelta,
        0,
        scrollbarHeight.get(),
      );
      const scrollPercent = clampedScaledPosition / scrollbarHeight.get();
      const unscaledScrollAmount = scrollPercent * scrollableArea.get();

      nextScrollPosition.set(unscaledScrollAmount);
      prevY.set(absoluteY);
    },
    onDeactivate: () => {
      dismissScrollbar();
      nextScrollPosition.set(-1);
      prevY.set(-1);
    },
    onFinalize: () => {
      if (onEnd) onEnd();
    },
  });

  const gestures = useSimultaneousGestures(pressGesture, scrollGesture);
  //#endregion

  //#region Styles
  const thumbWrapperStyle = useAnimatedStyle(() => ({
    height: THUMB_SIZE,
    width: THUMB_SIZE,
    opacity: withTiming(scrollbarVisible ? 1 : 0, {
      duration: scrollbarVisible ? 150 : 500,
      //! See: https://github.com/MissingCore/Music/pull/480
      reduceMotion: ReduceMotion.Never,
    }),
    //? Prevents `dev` mode error when `scaledScrollAmount = NaN` from `0/0`.
    transform: [{ translateY: scaledScrollAmount.get() || 0 }],
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    height: withTiming(
      isOngoing.get() || prevY.get() !== -1 ? THUMB_SIZE : COLLAPSED_THUMB_SIZE,
      {
        duration: 150,
        //! See: https://github.com/MissingCore/Music/pull/480
        reduceMotion: ReduceMotion.Never,
      },
    ),
    width: THUMB_SIZE,
  }));
  //#endregion

  return (
    <Animated.View
      pointerEvents={scrollbarVisible ? "box-none" : "none"}
      // Subtract `THUMB_SIZE` so that at max scroll, the bottom of the
      // thumb doesn't hang over the scrollbar track.
      onLayout={(e) =>
        scrollbarHeight.set(e.nativeEvent.layout.height - THUMB_SIZE)
      }
      style={{ right: 8, top: top - THUMB_SIZE / 2, bottom }}
      className="absolute z-50"
    >
      <GestureDetector gesture={gestures}>
        <Animated.View style={thumbWrapperStyle} className="justify-center">
          <Animated.View
            pointerEvents="none"
            style={thumbStyle}
            className="rounded-full bg-onSurface"
          />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

//#region Hook
export function useScrollbarContext() {
  const listHeight = useSharedValue(0);
  const listScrollHeight = useSharedValue(0);
  const listScrollAmount = useSharedValue(0);

  return useMemo(
    () => ({
      /** Functions to apply to the list component. */
      layoutHandlers: {
        //* Figures out how much scrolling room we have (includes `listHeight`).
        onContentSizeChange: (_width: number, height: number) => {
          "worklet";
          listScrollHeight.set(height);
        },
        //* Determines the visible content area.
        onLayout: (e: LayoutChangeEvent) => {
          "worklet";
          listHeight.set(e.nativeEvent.layout.height);
        },
      },
      /** Props to spread onto the `<Scrollbar />` component. */
      layoutInfo: { listHeight, listScrollAmount, listScrollHeight },
      /** Use inside of the scroll listener. */
      onScroll: (e: ReanimatedScrollEvent) => {
        "worklet";
        listScrollAmount.set(e.contentOffset.y);
      },
    }),
    [listHeight, listScrollAmount, listScrollHeight],
  );
}
//#endregion
