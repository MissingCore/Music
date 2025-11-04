import { useEffect, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { AnimatedRef, SharedValue } from "react-native-reanimated";
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import Animated, {
  clamp,
  runOnJS,
  runOnUI,
  scrollTo,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { OnRTLWorklet } from "~/lib/react";

interface ScrollbarProps {
  listRef: AnimatedRef<any>;
  listHeight: SharedValue<number>;
  listScrollHeight: SharedValue<number>;
  listScrollAmount: SharedValue<number>;

  scrollbarOffset: { top: number; bottom: number };

  isVisible?: boolean;
}

const THUMB_SIZE = 48;
const COLLAPSED_THUMB_SIZE = 6;

const SCROLL_SUBSCRIPTION_ID = 1234567890;
/** Delay before the scrollbar becomes invisible. */
const HIDE_DELAY = 2000;

export function Scrollbar({
  listRef,
  listHeight,
  listScrollHeight,
  listScrollAmount,
  scrollbarOffset: { top, bottom },
  isVisible = true,
}: ScrollbarProps) {
  const [scrollbarVisible, setScrollbarVisible] = useState(false);
  const [thumbPressed, setThumbPressed] = useState(false);
  const scrollbarHeight = useSharedValue(0);

  const prevY = useSharedValue(-1);
  const nextScrollPosition = useSharedValue(-1);
  const isScrollingBuffer = useSharedValue(0); // Boolean field

  //* Only show scrollbar if we have at least 3 screens worth of content.
  useDerivedValue(() => {
    const hasEnoughContent = listScrollHeight.value / listHeight.value > 3;
    runOnJS(setScrollbarVisible)(
      isVisible && hasEnoughContent && isScrollingBuffer.value !== 0,
    );
  });

  //* How much we can actually scroll.
  const scrollableArea = useDerivedValue(
    () => listScrollHeight.value - listHeight.value,
  );

  //* Scales down `listScrollAmount` to fit inside of `scrollbarHeight`.
  const scaledScrollAmount = useDerivedValue(() => {
    const scrollPercent = listScrollAmount.value / scrollableArea.value;
    return scrollPercent * scrollbarHeight.value;
  });

  const scrollGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .enabled(scrollbarVisible)
    .onStart(({ absoluteY }) => {
      prevY.value = absoluteY;
    })
    .onUpdate(({ absoluteY }) => {
      const changeDelta = absoluteY - prevY.value;
      const clampedScaledPosition = clamp(
        0,
        scaledScrollAmount.value + changeDelta,
        scrollbarHeight.value,
      );
      const scrollPercent = clampedScaledPosition / scrollbarHeight.value;
      const unscaledScrollAmount = scrollPercent * scrollableArea.value;

      nextScrollPosition.value = unscaledScrollAmount;
      prevY.value = absoluteY;
    })
    .onEnd(() => {
      nextScrollPosition.value = -1;
      prevY.value = -1;
    });

  //* Scroll to given offset using Reanimated.
  useDerivedValue(() => {
    if (nextScrollPosition.value === -1) return;
    // `animated` argument needs to be `true` or otherwise, we get choppy scrolling.
    scrollTo(listRef, 0, nextScrollPosition.value, true);
  });

  //* Only show scrollbar when we're scrolling and hide it after a delay
  //* after stopping.
  useEffect(() => {
    runOnUI(() =>
      listScrollAmount.addListener(SCROLL_SUBSCRIPTION_ID, () => {
        isScrollingBuffer.value = 1;
        isScrollingBuffer.value = withTiming(0, { duration: HIDE_DELAY });
      }),
    )();

    return () => {
      runOnUI(() => listScrollAmount.removeListener(SCROLL_SUBSCRIPTION_ID))();
    };
  }, [listScrollAmount, isScrollingBuffer, prevY]);

  const thumbWrapperStyle = useAnimatedStyle(() => ({
    height: THUMB_SIZE,
    width: THUMB_SIZE,
    opacity: withTiming(scrollbarVisible ? 1 : 0, {
      duration: scrollbarVisible ? 150 : 500,
    }),
    transform: [{ translateY: scaledScrollAmount.value }],
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    height: withTiming(
      thumbPressed || prevY.value !== -1 ? THUMB_SIZE : COLLAPSED_THUMB_SIZE,
      { duration: 150 },
    ),
    width: THUMB_SIZE,
  }));

  return (
    <Animated.View
      pointerEvents={!scrollbarVisible ? "none" : undefined}
      onLayout={(e) => {
        // Subtract `THUMB_SIZE` so that at max scroll, the bottom of the
        // thumb doesn't hang over the scrollbar track.
        scrollbarHeight.value = e.nativeEvent.layout.height - THUMB_SIZE;
      }}
      style={[
        {
          [OnRTLWorklet.decide("left", "right")]: 8,
          top: top - THUMB_SIZE / 2,
          bottom,
        },
      ]}
      className="absolute"
    >
      <GestureDetector gesture={scrollGesture}>
        <Animated.View
          style={thumbWrapperStyle}
          className="relative justify-center"
        >
          <Pressable
            onPressIn={() => setThumbPressed(true)}
            onPressOut={() => setThumbPressed(false)}
            className="size-full"
          />
          <Animated.View
            pointerEvents="none"
            style={thumbStyle}
            className="absolute rounded-full bg-foreground"
          />
        </Animated.View>
      </GestureDetector>
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
