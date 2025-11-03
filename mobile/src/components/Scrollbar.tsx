import type { FlashList } from "@shopify/flash-list";
import { useCallback, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { AnimatedRef, SharedValue } from "react-native-reanimated";
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import Animated, {
  clamp,
  scrollTo,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { OnRTLWorklet } from "~/lib/react";

interface ScrollbarProps {
  isVisible?: boolean;

  /** How much we scrolled so far. */
  scrollAmount: SharedValue<number>;
  /** Modify scroll position by delta. */
  scrollByDelta: (delta: number) => void;

  /** Offset from top of device for where the scrollbar will start. */
  topOffset: number;
  /** Offset from bottom of device for where the scrollbar will end. */
  bottomOffset: number;
}

/**
 * Distance above & below the thumb that can be pressed.
 *  - Thumb is normally `4px` tall and can grow to `32px`.
 */
const TOUCH_OFFSET = 14;

export function Scrollbar({
  isVisible = true,
  scrollAmount,
  scrollByDelta,
  ...props
}: ScrollbarProps) {
  const [scrollEnabled, setScrollEnabled] = useState(false);

  const isActive = useSharedValue(false);
  const prevPosition = useSharedValue(0);

  const scrollGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .enabled(isVisible || scrollEnabled)
    .onStart(({ absoluteY }) => {
      isActive.value = true;
      prevPosition.value = absoluteY;
    })
    .onUpdate(({ absoluteY }) => {
      scrollByDelta(absoluteY - prevPosition.value);
      prevPosition.value = absoluteY;
    })
    .onEnd(() => {
      isActive.value = false;
    });

  const thumbWrapperStyle = useAnimatedStyle(() => ({
    opacity: isVisible ? 1 : 0,
    transform: [{ translateY: scrollAmount.value }],
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    height: withTiming(scrollEnabled || isActive.value ? 32 : 4, {
      duration: 150,
    }),
  }));

  return (
    <Animated.View
      pointerEvents={!isVisible ? "none" : undefined}
      style={[
        {
          [OnRTLWorklet.decide("left", "right")]: 8,
          top: props.topOffset - TOUCH_OFFSET,
          bottom: props.bottomOffset - TOUCH_OFFSET,
        },
      ]}
      className="absolute"
    >
      <GestureDetector gesture={scrollGesture}>
        <Animated.View
          style={thumbWrapperStyle}
          className="relative size-8 justify-center"
        >
          <Pressable
            onPressIn={() => setScrollEnabled(true)}
            onPressOut={() => setScrollEnabled(false)}
            className="size-full"
          />
          <Animated.View
            style={thumbStyle}
            className="absolute w-8 rounded-full bg-red"
          />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

//#region Hook
export function useScrollbarContext(args: {
  listRef: AnimatedRef<FlashList<any>>;
  showScrollbar: boolean;
  topOffset: number;
  bottomOffset: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  // To prevent divisible by 0 error.
  const [layoutHeight, setLayoutHeight] = useState(99999);
  // How much we can scroll.
  const scrollableHeight = useSharedValue(0);
  // List scroll position in relation to the scrollable area.
  const scrollPosition = useSharedValue(0);
  // How we'll update the current scroll position as animated ref is `{}`
  // inside a worklet function.
  const nextScrollPosition = useSharedValue(0);

  // Area where the scrollbar is present.
  const scrollRange = useMemo(
    () => layoutHeight - args.topOffset - args.bottomOffset - TOUCH_OFFSET - 2,
    [args.topOffset, args.bottomOffset, layoutHeight],
  );

  // Updates the list's scroll position.
  useDerivedValue(() => {
    scrollTo(args.listRef, 0, nextScrollPosition.value, false);
  });

  const listHandlers = useMemo(
    () => ({
      //* Determines whether the scrollbar will be presented and figures
      //* out how much we can scroll.
      onContentSizeChange: (_width: number, height: number) => {
        scrollableHeight.value = height;
        // Scrollbar should only be visible if we have a substantial area
        // (3x the visible area).
        setIsVisible(args.showScrollbar && height / layoutHeight > 3);
      },
      //* Determines the visible content area.
      onLayout: (e: LayoutChangeEvent) => {
        setLayoutHeight(e.nativeEvent.layout.height);
      },
    }),
    [args.showScrollbar, layoutHeight, scrollableHeight],
  );

  const onScroll = useCallback(
    ({ contentOffset: { y } }: ReanimatedScrollEvent) => {
      "worklet";
      if (!isVisible) return;
      const scrollPercent = y / (scrollableHeight.value - layoutHeight);
      scrollPosition.value = scrollPercent * scrollRange;
    },
    [isVisible, layoutHeight, scrollableHeight, scrollPosition, scrollRange],
  );

  const scrollbarProps: ScrollbarProps = useMemo(
    () => ({
      isVisible,
      scrollAmount: scrollPosition,
      scrollByDelta: (delta: number) => {
        "worklet";
        const scrollProgress =
          clamp(0, scrollPosition.value + delta, scrollRange) / scrollRange;
        nextScrollPosition.value =
          scrollProgress * (scrollableHeight.value - layoutHeight);
      },
      topOffset: args.topOffset,
      bottomOffset: args.bottomOffset,
    }),
    [
      args.bottomOffset,
      args.topOffset,
      isVisible,
      layoutHeight,
      nextScrollPosition,
      scrollableHeight,
      scrollPosition,
      scrollRange,
    ],
  );

  return useMemo(
    () => ({ listHandlers, onScroll, scrollbarProps }),
    [listHandlers, onScroll, scrollbarProps],
  );
}
//#endregion
