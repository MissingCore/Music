import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { NothingArrowRight } from "~/resources/icons/NothingArrowRight";
import { useTheme } from "~/hooks/useTheme";

import { OnRTLWorklet } from "~/lib/react";
import { cn } from "~/lib/style";

type BounceSwipeableProps = {
  children: React.ReactNode;
  /** Distance to swipe to trigger an action (defaults to `24`). */
  activationThreshold?: number;
  /** Max distance we can swipe (defaults to `48`). */
  swipeThreshold?: number;

  /** Callback when we the right indicator is shown. */
  onLeftIndicatorVisible?: VoidFunction;
  /** Callback when we the left indicator is shown. */
  onRightIndicatorVisible?: VoidFunction;
  /** Visual element when swiping left. */
  LeftIndicator?: React.ReactNode;
  /** Visual element when swiping left. */
  RightIndicator?: React.ReactNode;

  /** Customize the shadows that appear on either ends when swiping. */
  shadowConfig?: {
    /** Color of the container this `<Marquee />` will be on. Defaults to `canvas`. */
    color?: Exclude<keyof ReturnType<typeof useTheme>, "theme">;
    width?: number;
  };

  className?: string;
  wrapperClassName?: string;
};

export function BounceSwipeable({
  activationThreshold = 32,
  swipeThreshold = 48,
  LeftIndicator = <SwipeIndicator rotate />,
  RightIndicator = <SwipeIndicator />,
  ...props
}: BounceSwipeableProps) {
  const themeColors = useTheme();
  const contentHeight = useSharedValue(0);
  const initX = useSharedValue<number | null>(null);
  const swipeAmount = useSharedValue(0);

  const shadowConfig = useMemo(
    () => ({
      color: "canvas" as const,
      width: 24,
      ...props.shadowConfig,
    }),
    [props.shadowConfig],
  );
  const shadowColor = useMemo(
    () => themeColors[shadowConfig.color],
    [themeColors, shadowConfig.color],
  );
  // This will enable support of hexadecimal colors with opacity.
  const startColor = useMemo(() => `${shadowColor}00`, [shadowColor]);
  const endColor = useMemo(() => `${shadowColor}E6`, [shadowColor]);

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
    .onEnd(async () => {
      const metThreshold = Math.abs(swipeAmount.value) >= activationThreshold;
      const usedRightAction = swipeAmount.value < 0;

      // Cleanup
      initX.value = null;
      swipeAmount.value = withTiming(0, { duration: 150 }, (finished) => {
        // Run code if we met the threshold.
        if (finished && metThreshold) {
          if (usedRightAction) runOnJS(props.onRightIndicatorVisible!)();
          else runOnJS(props.onLeftIndicatorVisible!)();
        }
      });
    });

  const containerStyle = useAnimatedStyle(() => ({
    // Prevent visual layout shift on mount.
    opacity: contentHeight.value === 0 ? 0 : 1,
    transform: [
      { translateX: swipeAmount.value ?? 0 },
      { translateY: -contentHeight.value / 2 },
    ],
  }));

  // Styles to determine when to render the scroll shadow.
  const leftShadowStyle = useAnimatedStyle(() => ({
    display:
      swipeAmount.value === 0 || swipeAmount.value === swipeThreshold
        ? "none"
        : undefined,
    width: shadowConfig.width,
    [OnRTLWorklet.decide("right", "left")]: 0,
  }));
  const rightShadowStyle = useAnimatedStyle(() => ({
    display:
      swipeAmount.value === 0 || swipeAmount.value === -swipeThreshold
        ? "none"
        : undefined,
    width: shadowConfig.width,
    [OnRTLWorklet.decide("left", "right")]: 0,
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

      <Animated.View
        pointerEvents="none"
        style={leftShadowStyle}
        className="absolute top-0 h-full"
      >
        <LinearGradient colors={[endColor, startColor]} {...ShadowProps} />
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={rightShadowStyle}
        className="absolute top-0 h-full"
      >
        <LinearGradient colors={[startColor, endColor]} {...ShadowProps} />
      </Animated.View>
    </View>
  );
}

const ShadowProps = {
  start: { x: 0.0, y: 1.0 },
  end: { x: 1.0, y: 1.0 },
  className: "h-full",
};

function SwipeIndicator({ rotate = false }) {
  const { foreground } = useTheme();
  return (
    <View className={cn("pl-3", { "rotate-180": rotate })}>
      <NothingArrowRight size={32} color={foreground} />
    </View>
  );
}
