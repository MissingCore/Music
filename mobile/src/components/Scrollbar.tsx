import { useCallback, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { ReanimatedScrollEvent } from "react-native-reanimated/lib/typescript/hook/commonTypes";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { OnRTLWorklet } from "~/lib/react";

interface ScrollbarProps {
  disabled?: boolean;
  /** Offset from top of device for where the scrollbar will start. */
  topOffset: number;
  /** Offset from bottom of device for where the scrollbar will end. */
  bottomOffset: number;
}

export function Scrollbar({ disabled = false, ...props }: ScrollbarProps) {
  const [scrollEnabled, setScrollEnabled] = useState(false);

  const isActive = useSharedValue(false);

  const scrollGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .enabled(!disabled || scrollEnabled);

  const thumbStyle = useAnimatedStyle(() => ({
    opacity: disabled ? 0 : 1,
    height: isActive.value ? 32 : 4,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          [OnRTLWorklet.decide("left", "right")]: 8,
          top: props.topOffset,
          bottom: props.bottomOffset,
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
export function useScrollbarContext(showScrollbar: boolean) {
  const [isVisible, setIsVisible] = useState(false);
  // To prevent divisible by 0 error.
  const layoutHeight = useRef(99999);
  const scrollableHeight = useSharedValue(0);

  const onContentSizeChange = useCallback(
    (_width: number, height: number) => {
      scrollableHeight.value = height;
      // Scrollbar should only be visible if we have a substantial area
      // (5x the visible area).
      setIsVisible(showScrollbar && height / layoutHeight.current > 5);
    },
    [scrollableHeight, showScrollbar],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    layoutHeight.current = e.nativeEvent.layout.height;
  }, []);

  const onScroll = useCallback((e: ReanimatedScrollEvent) => {
    "worklet";
    console.log(e);
  }, []);

  return useMemo(
    () => ({ isVisible, onContentSizeChange, onLayout, onScroll }),
    [isVisible, onContentSizeChange, onLayout, onScroll],
  );
}
//#endregion
