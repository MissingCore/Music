import { useState } from "react";
import { Pressable } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";

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

  const scrollGesture = Gesture.Pan()
    .activeOffsetY([-10, 10])
    .enabled(!disabled && scrollEnabled);

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
            style={{ height: 4 }}
            className="absolute w-8 rounded-full bg-red"
          />
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}
