import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  runOnJS,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { NothingArrowRight } from "~/resources/icons/NothingArrowRight";
import { useTheme } from "~/hooks/useTheme";

import { cn } from "~/lib/style";

type BounceSwipeableProps = {
  children: React.ReactNode;
  /** Distance to swipe to trigger an action (defaults to `24`). */
  activationThreshold?: number;
  /** Max distance we can swipe (defaults to `48`). */
  swipeThreshold?: number;
  /**
   * Delay for the swiped content bounces back. This helps prevent
   * the animation from freezing if the callback blocks the JS thread.
   */
  bounceBackDelay?: number;

  /** Callback when we the right indicator is shown. */
  onLeftIndicatorVisible?: () => void | Promise<void>;
  /** Callback when we the left indicator is shown. */
  onRightIndicatorVisible?: () => void | Promise<void>;
  /** Visual element when swiping left. */
  LeftIndicator?: React.ReactNode;
  /** Visual element when swiping left. */
  RightIndicator?: React.ReactNode;

  className?: string;
  wrapperClassName?: string;
};

export function BounceSwipeable({
  activationThreshold = 32,
  swipeThreshold = 48,
  bounceBackDelay = 25,
  LeftIndicator = <SwipeIndicator rotate />,
  RightIndicator = <SwipeIndicator />,
  ...props
}: BounceSwipeableProps) {
  const contentHeight = useSharedValue(0);
  const initX = useSharedValue<number | null>(null);
  const swipeAmount = useSharedValue(0);

  const onCleanp = () => {
    "worklet";
    initX.value = null;
    // Call after a delay in case the callback blocks the JS thread.
    swipeAmount.value = withDelay(bounceBackDelay, withTiming(0));
  };

  const handleLeftIndicatorVisible = async () => {
    if (props.onLeftIndicatorVisible) await props.onLeftIndicatorVisible();
    runOnUI(onCleanp)();
  };

  const handleRightIndicatorVisible = async () => {
    if (props.onRightIndicatorVisible) await props.onRightIndicatorVisible();
    runOnUI(onCleanp)();
  };

  const swipeGesture = Gesture.Pan()
    .onStart(({ absoluteX }) => {
      initX.value = absoluteX;
    })
    .onUpdate(({ absoluteX }) => {
      swipeAmount.value = clamp(
        props.onLeftIndicatorVisible ? -swipeThreshold : 0,
        absoluteX - initX.value!,
        props.onRightIndicatorVisible ? swipeThreshold : 0,
      );
    })
    .onEnd(() => {
      // Run code if we met the threshold.
      if (Math.abs(swipeAmount.value) >= activationThreshold) {
        if (swipeAmount.value < 0) runOnJS(handleLeftIndicatorVisible)();
        else runOnJS(handleRightIndicatorVisible)();
      }
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
    <View
      className={cn("relative h-full overflow-hidden", props.wrapperClassName)}
    >
      <GestureDetector gesture={swipeGesture}>
        <Animated.View
          onLayout={({ nativeEvent }) => {
            contentHeight.value = nativeEvent.layout.height;
          }}
          style={containerStyle}
          className={cn("absolute left-0 right-0 top-1/2", props.className)}
        >
          <View className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2">
            {LeftIndicator}
          </View>
          {props.children}
          <View className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full">
            {RightIndicator}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function SwipeIndicator({ rotate = false }) {
  const { foreground } = useTheme();
  return (
    <View className={cn("pl-3", { "rotate-180": rotate })}>
      <NothingArrowRight size={32} color={foreground} />
    </View>
  );
}
