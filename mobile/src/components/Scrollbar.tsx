import { useCallback, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { OnRTLWorklet } from "~/lib/react";

interface ScrollbarProps {
  disabled?: boolean;

  /** How much we scrolled so far. */
  scrollAmount: SharedValue<number>;

  /** Offset from top of device for where the scrollbar will start. */
  topOffset: number;
  /** Offset from bottom of device for where the scrollbar will end. */
  bottomOffset: number;
}

/** Distance above & below the thumb that can be pressed. */
const TOUCH_OFFSET = 14;

export function Scrollbar({
  disabled = false,
  scrollAmount,
  ...props
}: ScrollbarProps) {
  const [scrollEnabled, setScrollEnabled] = useState(false);

  const isActive = useSharedValue(false);

  const scrollGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .enabled(!disabled || scrollEnabled);

  const thumbStyle = useAnimatedStyle(() => ({
    opacity: disabled ? 0 : 1,
    height: isActive.value ? 32 : 4,
    transform: [{ translateY: scrollAmount.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
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
        <Animated.View className="relative size-8 justify-center">
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

  // Area where the scrollbar is present.
  const scrollRange = useMemo(
    () => layoutHeight - args.topOffset - args.bottomOffset - TOUCH_OFFSET - 2,
    [args.topOffset, args.bottomOffset, layoutHeight],
  );

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      scrollableHeight.value = height;
      // Scrollbar should only be visible if we have a substantial area
      // (3x the visible area).
      setIsVisible(args.showScrollbar && height / layoutHeight > 3);
    },
    [args.showScrollbar, layoutHeight, scrollableHeight],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setLayoutHeight(e.nativeEvent.layout.height);
  }, []);

  const onScroll = useCallback(
    ({ contentOffset: { y } }: ReanimatedScrollEvent) => {
      "worklet";
      if (!isVisible) return;
      const scrollPercent = y / (scrollableHeight.value - layoutHeight);
      scrollPosition.value = scrollPercent * scrollRange;
    },
    [isVisible, layoutHeight, scrollableHeight, scrollPosition, scrollRange],
  );

  return useMemo(
    () => ({
      isVisible,
      onContentSizeChange,
      onLayout,
      onScroll,
      scrollPosition,
    }),
    [isVisible, onContentSizeChange, onLayout, onScroll, scrollPosition],
  );
}
//#endregion
