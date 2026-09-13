// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useCallback, useState } from "react";
import { useWindowDimensions } from "react-native";
import {
  GestureDetector,
  useLongPressGesture,
  usePanGesture,
  useSimultaneousGestures,
} from "react-native-gesture-handler";
import type { AnimatedRef } from "react-native-reanimated";
import Animated, {
  clamp,
  ReduceMotion,
  scrollTo,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useScrollContext } from "../base/scroll-context";
import { scheduleOnRN } from "react-native-worklets";

interface ScrollbarProps {
  /** Absolute positon of where the scrollbar will start & end. */
  offset: { top: number; bottom: number };
  /**
   * The height of the list including the amount we can scroll. This is
   * obtained from the `onContentSizeChange` prop on the list component.
   */
  fullListHeight: number;
}

const THUMB_SIZE = 48;
const COLLAPSED_THUMB_SIZE = 6;

/** Delay before the scrollbar becomes invisible. */
const HIDE_DELAY = 2000;

export function Scrollbar({
  offset: { top, bottom },
  fullListHeight,
}: ScrollbarProps) {
  //? As of React Native 0.86, `height` includes the window decorations
  //? (status & navigation bar).
  const { height } = useWindowDimensions();
  const { scrollRef, scrollAmount } = useScrollContext();

  // We subtract `THUMB_SIZE / 2` to prevent it from appearing beyond the track.
  const scrollbarHeight = height - top - bottom - THUMB_SIZE / 2;
  // The amount we can scroll.
  const scrollableArea = fullListHeight - height;

  // Scale down `scrollAmount` to fit within `scrollbarHeight`.
  const scaledScrollAmount = useDerivedValue(() => {
    const scrollPercent = scrollAmount.get() / scrollableArea;
    return scrollPercent * scrollbarHeight || 0;
  });

  //#region Scroll Handing
  const prevY = useSharedValue(-1);
  const nextScrollPosition = useSharedValue(-1);

  useDerivedValue(() => {
    if (nextScrollPosition.get() === -1) return;
    //? For some reason on the New Architecture, things only work if we set
    //? this to `false`, like in our original implementation in:
    //?   - https://github.com/MissingCore/Music/commit/e9a1ff9b66390928210ff054629b6b7d09e1af6a
    scrollTo(scrollRef as AnimatedRef<any>, 0, nextScrollPosition.get(), false);
  });
  //#endregion

  //#region Availability & Visibility
  const [isAvailable, setIsAvailable] = useState(false);
  const isInteracting = useSharedValue(false);

  const gracePeriod = useSharedValue(0); // Boolean field
  const startGracePeriodCountdown = useCallback(() => {
    "worklet";
    gracePeriod.set(
      withTiming(0, { duration: HIDE_DELAY, reduceMotion: ReduceMotion.Never }),
    );
  }, [gracePeriod]);

  //* Keeps the scrollbar visible.
  const persistScrollbar = useCallback(() => {
    "worklet";
    isInteracting.set(true);
    gracePeriod.set(1);
  }, [isInteracting, gracePeriod]);

  //* Start the timer to hide the scrollbar.
  const dismissScrollbar = useCallback(() => {
    "worklet";
    isInteracting.set(false);
    startGracePeriodCountdown();
  }, [isInteracting, startGracePeriodCountdown]);

  //* Enable scrollbar if we have at least 2 screens worth of content.
  useDerivedValue(() => {
    const hasEnoughContent = fullListHeight / scrollbarHeight > 2;
    scheduleOnRN(setIsAvailable, hasEnoughContent && gracePeriod.get() !== 0);
  });

  //* Scrollbar can only be (potentially) enabled after scrolling the screen.
  useAnimatedReaction(
    () => scrollAmount.get(),
    (_, prevVal) => {
      if (prevVal === null) return; //? Don't call on "initialization".
      gracePeriod.set(1);
      if (isInteracting.get()) return;
      startGracePeriodCountdown();
    },
  );
  //#endregion

  //#region Gestures
  const pressGesture = useLongPressGesture({
    enabled: isAvailable,
    minDuration: 0,
    onActivate: persistScrollbar,
    onDeactivate: dismissScrollbar,
  });

  const scrollGesture = usePanGesture({
    enabled: isAvailable,
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
        scrollbarHeight,
      );

      const scrollPercent = clampedScaledPosition / scrollbarHeight;
      const unscaledScrollAmount = scrollPercent * scrollableArea;

      nextScrollPosition.set(unscaledScrollAmount);
      prevY.set(absoluteY);
    },
    onDeactivate: () => {
      dismissScrollbar();
      nextScrollPosition.set(-1);
      prevY.set(-1);
    },
  });

  const gestures = useSimultaneousGestures(pressGesture, scrollGesture);
  //#endregion

  //#region Styling
  const thumbWrapperStyle = useAnimatedStyle(() => ({
    height: THUMB_SIZE,
    width: THUMB_SIZE,
    opacity: withTiming(isAvailable ? 1 : 0, {
      duration: isAvailable ? 150 : 500,
      reduceMotion: ReduceMotion.Never,
    }),
    transform: [{ translateY: scaledScrollAmount.get() }],
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    height: withTiming(
      isInteracting.get() || prevY.get() !== -1
        ? THUMB_SIZE
        : COLLAPSED_THUMB_SIZE,
      { duration: 150, reduceMotion: ReduceMotion.Never },
    ),
    width: THUMB_SIZE,
  }));
  //#endregion

  return (
    <Animated.View
      pointerEvents={isAvailable ? "box-none" : "none"}
      style={{ right: 8, top: top - THUMB_SIZE / 2, bottom }}
      className="absolute z-50"
    >
      <GestureDetector gesture={gestures}>
        <Animated.View style={thumbWrapperStyle} className="justify-center">
          <Animated.View
            style={thumbStyle}
            className="rounded-full bg-onSurface"
          />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
