import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Animated, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { NothingArrowRight } from "~/resources/icons/NothingArrowRight";
import { useTheme } from "~/hooks/useTheme";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";

interface BounceSwipeableProps {
  children: React.ReactNode;

  /** Distance to swipe to trigger an action (defaults to `125`). */
  activationThreshold?: number;
  /** Percentage of container to swipe to trigger an action (defaults to `0.5`). */
  activationThresholdRatio?: number;
  /** If we send the item off screen when the swipe action is activated. */
  overshootSwipe?: boolean;
  /** Duration for the animation (defaults to `250`). */
  durationMS?: number;

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

export function BounceSwipeable({
  activationThreshold = 125,
  activationThresholdRatio = 0.5,
  overshootSwipe = true,
  durationMS = 250,
  RightIcon = <SwipeIcon />,
  LeftIcon = <SwipeIcon rotate />,
  ...props
}: BounceSwipeableProps) {
  const initX = useRef(0);
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
    (currentX: number) =>
      clamp(
        props.onSwipeLeft ? -rowWidth.current : 0,
        currentX - initX.current,
        props.onSwipeRight ? rowWidth.current : 0,
      ),
    [props.onSwipeLeft, props.onSwipeRight],
  );

  const swipeGesture = Gesture.Pan()
    // Since we're not using `react-native-reanimated`.
    .runOnJS(true)
    // Allows scrolling to work without triggering gesture.
    .activeOffsetX([-10, 10])
    .onStart(({ absoluteX }) => {
      animationRef.current?.stop();
      initX.current = absoluteX;
    })
    .onUpdate(({ absoluteX }) => {
      dragX.setValue(clampSwipeAmount(absoluteX));
    })
    .onEnd(({ absoluteX }) => {
      // When swiping very fast and since we're updating `swipeAmount`
      // on the JS thread so it can be read, `swipeAmount` may not actually
      // contain the value represented by the pan gesture.
      const trueSwipeAmount = clampSwipeAmount(absoluteX);
      const metThreshold =
        Math.abs(trueSwipeAmount) >=
        Math.min(
          activationThreshold,
          rowWidth.current * activationThresholdRatio,
        );
      const swipedLeft = trueSwipeAmount < 0;

      // Cleanup
      initX.current = 0;

      // Create animation the swiped item will translate to.
      const animateToOnSuccess = overshootSwipe
        ? (swipedLeft ? -1 : 1) * rowWidth.current
        : 0;
      animationRef.current = Animated.timing(dragX, {
        duration: durationMS,
        toValue: metThreshold ? animateToOnSuccess : 0,
        useNativeDriver: true,
      });

      animationRef.current.start(({ finished }) => {
        // Reset to prevent the recycled item being stuck in the swiped state.
        dragX.setValue(0);

        // Run code if we met the threshold.
        if (finished && metThreshold) {
          if (swipedLeft) props.onSwipeLeft!();
          else props.onSwipeRight!();
        }
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
