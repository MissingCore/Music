import { useCallback, useEffect, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
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
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";

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
  const scrollbarHeight = useSharedValue(0);

  const prevY = useSharedValue(-1);
  const nextScrollPosition = useSharedValue(-1);

  //* How much we can actually scroll.
  const scrollableArea = useDerivedValue(
    () => listScrollHeight.value - listHeight.value,
  );

  //* Scales down `listScrollAmount` to fit inside of `scrollbarHeight`.
  const scaledScrollAmount = useDerivedValue(() => {
    const scrollPercent = listScrollAmount.value / scrollableArea.value;
    return scrollPercent * scrollbarHeight.value;
  });

  //* Scroll to given offset using Reanimated.
  useDerivedValue(() => {
    if (nextScrollPosition.value === -1) return;
    //? For some reason on the New Architecture, things only work if we set
    //? this to `false`, like in our original implementation in:
    //?   - https://github.com/MissingCore/Music/commit/e9a1ff9b66390928210ff054629b6b7d09e1af6a
    scrollTo(listRef, 0, nextScrollPosition.value, false);
  });

  //#region Visibility
  const [scrollbarVisible, setScrollbarVisible] = useState(false);
  const isOngoing = useSharedValue(false);
  const isScrollingBuffer = useSharedValue(0); // Boolean field

  //* Keeps the scrollbar visible.
  const persistScrollbar = useCallback(() => {
    "worklet";
    isOngoing.value = true;
    isScrollingBuffer.value = 1;
  }, [isOngoing, isScrollingBuffer]);

  //* Start the timer to hide the scrollbar.
  const dismissScrollbar = useCallback(() => {
    "worklet";
    isOngoing.value = false;
    isScrollingBuffer.value = withTiming(0, { duration: HIDE_DELAY });
  }, [isOngoing, isScrollingBuffer]);

  //* Show scrollbar if we have at least 2 screens worth of content.
  useDerivedValue(() => {
    const hasEnoughContent = listScrollHeight.value / listHeight.value > 2;
    scheduleOnRN(
      setScrollbarVisible,
      isVisible && hasEnoughContent && isScrollingBuffer.value !== 0,
    );
  });

  //* Show scrollbar when we're scrolling and hide it after a delay
  //* after stopping when the thumb is released.
  useEffect(() => {
    scheduleOnUI(() =>
      listScrollAmount.addListener(SCROLL_SUBSCRIPTION_ID, () => {
        isScrollingBuffer.value = 1;
        if (isOngoing.value) return;
        isScrollingBuffer.value = withTiming(0, { duration: HIDE_DELAY });
      }),
    );

    return () => {
      scheduleOnUI(() =>
        listScrollAmount.removeListener(SCROLL_SUBSCRIPTION_ID),
      );
    };
  }, [isOngoing, listScrollAmount, isScrollingBuffer, prevY]);
  //#endregion

  //#region Gestures
  const pressGesture = Gesture.LongPress()
    .enabled(scrollbarVisible)
    .minDuration(0)
    .onStart(persistScrollbar)
    .onEnd(dismissScrollbar);

  const scrollGesture = Gesture.Pan()
    .enabled(scrollbarVisible)
    .onStart(({ absoluteY }) => {
      persistScrollbar();
      prevY.value = absoluteY;
    })
    .onUpdate(({ absoluteY }) => {
      persistScrollbar();
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
      dismissScrollbar();
      nextScrollPosition.value = -1;
      prevY.value = -1;
    });

  const gestures = Gesture.Simultaneous(pressGesture, scrollGesture);
  //#endregion

  //#region Styles
  const thumbWrapperStyle = useAnimatedStyle(() => ({
    height: THUMB_SIZE,
    width: THUMB_SIZE,
    opacity: withTiming(scrollbarVisible ? 1 : 0, {
      duration: scrollbarVisible ? 150 : 500,
    }),
    //? Prevents `dev` mode error when `scaledScrollAmount = NaN` from `0/0`.
    transform: [{ translateY: scaledScrollAmount.value || 0 }],
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    height: withTiming(
      isOngoing.value || prevY.value !== -1 ? THUMB_SIZE : COLLAPSED_THUMB_SIZE,
      { duration: 150 },
    ),
    width: THUMB_SIZE,
  }));
  //#endregion

  return (
    <Animated.View
      pointerEvents={scrollbarVisible ? "box-none" : "none"}
      onLayout={(e) => {
        // Subtract `THUMB_SIZE` so that at max scroll, the bottom of the
        // thumb doesn't hang over the scrollbar track.
        scrollbarHeight.value = e.nativeEvent.layout.height - THUMB_SIZE;
      }}
      style={{ right: 8, top: top - THUMB_SIZE / 2, bottom }}
      className="absolute"
    >
      <GestureDetector gesture={gestures}>
        <Animated.View style={thumbWrapperStyle} className="justify-center">
          <Animated.View
            pointerEvents="none"
            style={thumbStyle}
            className="rounded-full bg-foreground"
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
