import { useFocusEffect } from "@react-navigation/native";
import type { FlashList } from "@shopify/flash-list";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { AnimatedRef, SharedValue } from "react-native-reanimated";
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import Animated, {
  clamp,
  runOnUI,
  scrollTo,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { OnRTLWorklet } from "~/lib/react";

interface ScrollbarProps {
  listHeight: SharedValue<number>;
  listScrollHeight: SharedValue<number>;
  listScrollAmount: SharedValue<number>;

  scrollbarOffset: { top: number; bottom: number };
}

/**
 * Distance above & below the thumb that can be pressed.
 *  - Thumb is normally `4px` tall and can grow to `32px`.
 */
const TOUCH_OFFSET = 14;

export function Scrollbar({
  listHeight,
  listScrollHeight,
  listScrollAmount,
  scrollbarOffset: { top, bottom },
  ...props
}: ScrollbarProps) {
  const scrollbarHeight = useSharedValue(0);

  //* Scales down `listScrollAmount` to fit inside of `scrollbarHeight`.
  const scaledScrollAmount = useDerivedValue(() => {
    const scrollableArea = listScrollHeight.value - listHeight.value;
    const scrollPercent = listScrollAmount.value / scrollableArea;
    return scrollPercent * scrollbarHeight.value;
  });

  const thumbWrapperStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scaledScrollAmount.value }],
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    height: 32,
  }));

  return (
    <Animated.View
      onLayout={(e) => {
        // Subtract `32px` so that at max scroll, the bottom of the thumb
        // doesn't hang over the scrollbar track.
        scrollbarHeight.value = e.nativeEvent.layout.height - 32;
      }}
      style={[
        {
          [OnRTLWorklet.decide("left", "right")]: 8,
          top: top - TOUCH_OFFSET,
          bottom: bottom - TOUCH_OFFSET,
        },
      ]}
      className="absolute"
    >
      <Animated.View
        style={thumbWrapperStyle}
        className="relative size-8 justify-center"
      >
        <Animated.View
          style={thumbStyle}
          className="absolute w-8 rounded-full bg-red"
        />
      </Animated.View>
    </Animated.View>
  );
}

//#region Hook
export function useScrollbarContext() {
  const listHeight = useSharedValue(99999); // Prevent divisible by 0 error.
  const listScrollHeight = useSharedValue(0);
  const listScrollAmount = useSharedValue(0);

  return useMemo(
    () => ({
      /** Functions to apply to the list component. */
      layoutHandlers: {
        //* Figures out how much scrolling room we have (includes `listHeight`).
        onContentSizeChange: (_width: number, height: number) => {
          "worklet";
          listScrollHeight.value = height;
        },
        //* Determines the visible content area.
        onLayout: (e: LayoutChangeEvent) => {
          "worklet";
          listHeight.value = e.nativeEvent.layout.height;
        },
      },
      /** Props to spread onto the `<Scrollbar />` component. */
      layoutInfo: { listHeight, listScrollAmount, listScrollHeight },
      /** Use inside of the scroll listener. */
      onScroll: (e: ReanimatedScrollEvent) => {
        "worklet";
        listScrollAmount.value = e.contentOffset.y;
      },
    }),
    [listHeight, listScrollAmount, listScrollHeight],
  );
}
//#endregion
