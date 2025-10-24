import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Animated, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { NothingArrowRight } from "~/resources/icons/NothingArrowRight";
import { useTheme } from "~/hooks/useTheme";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";

const DRAG_TOSS = 0.02;

interface SwipeableProps {
  children: React.ReactNode;

  /** Distance to swipe to trigger an action. Defaults to `125`. */
  activationThreshold?: number;
  /** Percentage of container to swipe to trigger an action. Defaults to `0.5`. */
  activationThresholdRatio?: number;
  /** If we send the item off screen when the swipe action is activated. Defaults to `true`. */
  overshootSwipe?: boolean;

  /** Callback when we swipe to the left. */
  onSwipeLeft?: VoidFunction;
  /** Icon displayed on the right when swiping left. */
  RightIcon?: React.ReactNode;
  /** Style the container containing `RightIcon` (ie: background color, border radius). */
  rightIconContainerClassName?: string;

  /** Callback when we swipe to the right. */
  onSwipeRight?: VoidFunction;
  /** Icon displayed on the left when swiping right. */
  LeftIcon?: React.ReactNode;
  /** Style the container containing `LeftIcon` (ie: background color, border radius). */
  leftIconContainerClassName?: string;

  /** Visual element when swiping right. */
  LeftIndicator?: React.ReactNode;
  /** Visual element when swiping left. */
  RightIndicator?: React.ReactNode;

  className?: string;
  wrapperClassName?: string;
}

export function Swipeable({
  activationThreshold = 175,
  activationThresholdRatio = 0.5,
  overshootSwipe = true,
  RightIcon = <SwipeIcon />,
  LeftIcon = <SwipeIcon rotate />,
  ...props
}: SwipeableProps) {
  const rowWidth = useRef(0);
  // Need to be state to trigger re-render for indicator styles.
  const [swipeAmount, setSwipeAmount] = useState(0);

  const dragX = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation>(null);

  useEffect(() => {
    const listener = dragX.addListener(({ value }) => setSwipeAmount(value));
    return () => dragX.removeListener(listener);
  }, [dragX]);

  const clampSwipeAmount = useCallback(
    (translateX: number) =>
      clamp(
        props.onSwipeLeft ? -rowWidth.current : 0,
        translateX,
        props.onSwipeRight ? rowWidth.current : 0,
      ),
    [props.onSwipeLeft, props.onSwipeRight],
  );

  const swipeGesture = Gesture.Pan()
    // Since we're not using `react-native-reanimated`.
    .runOnJS(true)
    // Allows scrolling to work without triggering gesture.
    .activeOffsetX([-10, 10])
    .onStart(() => {
      animationRef.current?.stop();
    })
    .onUpdate(({ translationX }) => {
      dragX.setValue(clampSwipeAmount(translationX));
    })
    .onEnd(({ translationX, velocityX }) => {
      // Include velocity in final translated amount if overshoot is enabled.
      const velocityDistance = (overshootSwipe ? 1 : 0) * velocityX * DRAG_TOSS;
      const clampedTranslation = clampSwipeAmount(
        translationX + velocityDistance,
      );
      const metThreshold =
        Math.abs(clampedTranslation) >=
        Math.min(
          activationThreshold,
          rowWidth.current * activationThresholdRatio,
        );
      const swipedLeft = clampedTranslation < 0;

      // Don't run animation if we haven't moved.
      if (clampedTranslation === 0) return;

      // Create animation the swiped item will translate to.
      animationRef.current = overshootSwipe
        ? Animated.spring(dragX, {
            toValue: metThreshold
              ? (swipedLeft ? -1 : 1) * rowWidth.current
              : 0,
            bounciness: 0, // This prevents it from bouncing below `toValue`.
            restDisplacementThreshold: 0.4,
            restSpeedThreshold: 1.7,
            velocity: velocityX * 2,
            useNativeDriver: true,
          })
        : Animated.timing(dragX, {
            duration: 125,
            toValue: 0,
            useNativeDriver: true,
          });

      animationRef.current.start(async ({ finished }) => {
        // Run code if we met the threshold.
        if (finished && metThreshold) {
          if (swipedLeft) props.onSwipeLeft!();
          else props.onSwipeRight!();
        }

        // Reset to prevent the recycled item being stuck in the swiped state.
        dragX.setValue(0);
      });
    });

  const onRowLayout = useCallback((e: LayoutChangeEvent) => {
    rowWidth.current = e.nativeEvent.layout.width;
  }, []);

  const leftIndicator = useMemo(() => {
    if (!props.onSwipeRight || swipeAmount <= 0) return null;
    return (
      <SwipeIconWrapper
        direction="left"
        maxWidth={rowWidth.current}
        Icon={LeftIcon}
        dragAmount={dragX}
        className={props.leftIconContainerClassName}
      />
    );
  }, [
    LeftIcon,
    props.leftIconContainerClassName,
    props.onSwipeRight,
    dragX,
    swipeAmount,
  ]);

  const rightIndicator = useMemo(() => {
    if (!props.onSwipeLeft || swipeAmount >= 0) return null;
    return (
      <SwipeIconWrapper
        direction="right"
        maxWidth={rowWidth.current}
        Icon={RightIcon}
        dragAmount={dragX}
        className={props.rightIconContainerClassName}
      />
    );
  }, [
    RightIcon,
    props.rightIconContainerClassName,
    props.onSwipeLeft,
    dragX,
    swipeAmount,
  ]);

  return (
    <View className={cn("relative", props.wrapperClassName)}>
      {leftIndicator}
      {rightIndicator}
      <GestureDetector gesture={swipeGesture}>
        <Animated.View
          onLayout={onRowLayout}
          style={{ transform: [{ translateX: dragX }] }}
          className={props.className}
        >
          {props.children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

//#region Swipe Indicator
type Direction = "left" | "right";

const IconPosition: Record<Direction, [string, string]> = {
  left: ["right", "left"],
  right: ["left", "right"],
};

const InterpolateOptions: Record<
  Direction,
  (maxWidth: number, iconWidth: number) => Animated.InterpolationConfigType
> = {
  left: (maxWidth: number, iconWidth: number) => ({
    inputRange: [0, 1],
    // When `dragX = maxWidth`, we want the icon to be at the half-way point.
    //  - Do things in terms of percent (include offset for icon width).
    outputRange: [0, (maxWidth - iconWidth) / (2 * maxWidth)],
  }),
  right: (maxWidth: number, iconWidth: number) => ({
    inputRange: [-1, 0],
    outputRange: [-(maxWidth - iconWidth) / (2 * maxWidth), 0],
  }),
};

function SwipeIconWrapper(props: {
  direction: Direction;
  maxWidth: number;
  Icon: React.ReactNode;
  dragAmount: Animated.Value;
  className?: string;
}) {
  const iconWidth = useRef(0);

  const onIconLayout = useCallback((e: LayoutChangeEvent) => {
    iconWidth.current = e.nativeEvent.layout.width;
  }, []);

  return (
    <View
      style={{ maxWidth: props.maxWidth }}
      className={cn("absolute h-full w-full justify-center", props.className)}
    >
      <Animated.View
        onLayout={onIconLayout}
        style={{
          [OnRTL.decide(...IconPosition[props.direction])]: 0,
          transform: [
            {
              translateX: props.dragAmount.interpolate(
                InterpolateOptions[props.direction](
                  props.maxWidth,
                  iconWidth.current,
                ),
              ),
            },
          ],
        }}
        className="absolute"
      >
        {props.Icon}
      </Animated.View>
    </View>
  );
}

function SwipeIcon({ rotate = false }) {
  const { foreground } = useTheme();
  return (
    <View className={rotate ? "rotate-180" : undefined}>
      <NothingArrowRight size={32} color={foreground} />
    </View>
  );
}
//#endregion

//#region Helpers
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
//#endregion
