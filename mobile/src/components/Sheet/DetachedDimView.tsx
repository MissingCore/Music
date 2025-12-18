import type { PositionChangeEvent } from "@lodev09/react-native-true-sheet";
import { useMemo } from "react";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

export function useDetachedDimViewContext() {
  const dimness = useSharedValue(0);
  return useMemo(
    () => ({
      /** Apply to sheet that'll be on the top of the stack. */
      dimViewHandlers: {
        // Fake the dimness animation when the back action is done as
        // `onPositionChange` doesn't fire in this situation.
        onBackPress: () => {
          dimness.value = withTiming(0);
        },
        // Fires when we drag the sheet to dismiss.
        onPositionChange: (e: PositionChangeEvent) => {
          dimness.value = e.nativeEvent.detent * 0.5;
        },
      },
      /** Pass directly to `<DetachedDimView />`. */
      dimness,
    }),
    [dimness],
  );
}

export function DetachedDimView(props: { dimness: SharedValue<number> }) {
  const viewStyle = useAnimatedStyle(() => ({ opacity: props.dimness.value }));
  return (
    <Animated.View
      pointerEvents="none"
      style={viewStyle}
      className="absolute inset-0 z-50 bg-black"
    />
  );
}
