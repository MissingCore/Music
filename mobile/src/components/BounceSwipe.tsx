import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { cn } from "~/lib/style";

type BounceSwipeProps = {
  children: React.ReactNode;
  /** Distance to swipe to trigger an action (defaults to `24`). */
  activationThreshold?: number;
  /** Max distance we can swipe (defaults to `48`). */
  swipeThreshold?: number;
  /** Callback when we swipe fully to the left. */
  onLeftSwipe?: VoidFunction;
  /** Callback when we swipe fully to the right. */
  onRightSwipe?: VoidFunction;
  /** Visual element when swiping left. */
  LeftIndicator?: React.ReactNode;
  /** Visual element when swiping left. */
  RightIndicator?: React.ReactNode;
  className?: string;
  wrapperClassName?: string;
};

export function BounceSwipe({
  activationThreshold = 24,
  swipeThreshold = 48,
  ...props
}: BounceSwipeProps) {
  const contentHeight = useSharedValue(0);
  const initX = useSharedValue<number | null>(null);
  const swipeAmount = useSharedValue(0);

  const swipeGesture = Gesture.Pan()
    .onStart(({ absoluteX }) => {
      initX.value = absoluteX;
    })
    .onUpdate(({ absoluteX }) => {
      swipeAmount.value = clamp(
        props.onLeftSwipe ? -swipeThreshold : 0,
        absoluteX - initX.value!,
        props.onRightSwipe ? swipeThreshold : 0,
      );
    })
    .onEnd(() => {
      const metThreshold = Math.abs(swipeAmount.value) >= activationThreshold;

      if (metThreshold) {
        const usedRightAction = swipeAmount.value < 0;
        if (usedRightAction) runOnJS(props.onRightSwipe!)();
        else runOnJS(props.onLeftSwipe!)();
      }

      // Cleanup
      initX.value = null;
      swipeAmount.value = withTiming(0, { duration: 150 });
    });

  const containerStyle = useAnimatedStyle(() => ({
    // Prevent visual layout shift on mount.
    opacity: contentHeight.value === 0 ? 0 : 1,
    transform: [
      { translateX: swipeAmount.value ?? 0 },
      { translateY: -contentHeight.value / 2 },
    ],
  }));

  return (
    <View className={cn("relative h-full", props.wrapperClassName)}>
      <GestureDetector gesture={swipeGesture}>
        <Animated.View
          onLayout={({ nativeEvent }) => {
            contentHeight.value = nativeEvent.layout.height;
          }}
          style={containerStyle}
          className={cn("absolute left-0 right-0 top-1/2", props.className)}
        >
          <View>{props.children}</View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
