// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useCallback, useMemo, useState } from "react";
import type { LayoutChangeEvent } from "react-native";
import { View } from "react-native";
import { GestureDetector, usePanGesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  cancelAnimation,
  clamp,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Icon } from "~/resources/icons";

import { OnRTLWorklet } from "~/lib/react";
import { cn } from "~/lib/style";

const DRAG_TOSS = 0.02;

interface SwipeableProps {
  children: React.ReactNode;

  /** If the swipe gesture should be disabled. */
  disabled?: boolean;
  /** If we should fire the callback before the animation finishes. Defaults to `false`. */
  fireCallbackBeforeCompletion?: boolean;

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

  className?: string;
  wrapperClassName?: string;
}

export function Swipeable({
  disabled = false,
  fireCallbackBeforeCompletion = false,
  activationThreshold = 175,
  activationThresholdRatio = 0.5,
  overshootSwipe = true,
  RightIcon = <SwipeIcon />,
  LeftIcon = <SwipeIcon rotate />,
  //! Since Reanimated 4.5, calling `props.*` inside of a worklet function
  //! will throw: `[Worklets] Cannot copy value of type 'FiberNode'.`
  //!   - https://github.com/software-mansion/react-native-reanimated/pull/9532
  onSwipeLeft,
  onSwipeRight,
  ...props
}: SwipeableProps) {
  const rowWidth = useSharedValue(0);
  // Need to be state to trigger re-render for indicator styles.
  const [swipeAmount, setSwipeAmount] = useState(0);

  const dragX = useSharedValue(0);

  useAnimatedReaction(
    () => dragX.get(),
    (currVal) => scheduleOnRN(setSwipeAmount, currVal),
  );

  const clampSwipeAmount = useCallback(
    (translateX: number) => {
      "worklet";
      return clamp(
        translateX,
        onSwipeLeft ? -rowWidth.get() : 0,
        onSwipeRight ? rowWidth.get() : 0,
      );
    },
    [onSwipeLeft, onSwipeRight, rowWidth],
  );

  const swipeGesture = usePanGesture({
    // Allows scrolling to work without triggering gesture.
    activeOffsetX: [-10, 10],
    enabled: !disabled,
    onActivate: () => cancelAnimation(dragX),
    onUpdate: ({ translationX }) => dragX.set(clampSwipeAmount(translationX)),
    onDeactivate: ({ translationX, velocityX }) => {
      // Include velocity in final translated amount if overshoot is enabled.
      const velocityDistance = (overshootSwipe ? 1 : 0) * velocityX * DRAG_TOSS;
      const clampedTranslation = clampSwipeAmount(
        translationX + velocityDistance,
      );
      const metThreshold =
        Math.abs(clampedTranslation) >=
        Math.min(
          activationThreshold,
          rowWidth.get() * activationThresholdRatio,
        );
      const swipedLeft = clampedTranslation < 0;

      // Don't run animation if we haven't moved (don't use `clampedTranslation`
      // as it includes a change in distance that isn't rendered).
      if (clampSwipeAmount(translationX) === 0) return;

      // Run callback before the animation starts if we met the threshold.
      if (fireCallbackBeforeCompletion && metThreshold) {
        if (swipedLeft) scheduleOnRN(onSwipeLeft!);
        else scheduleOnRN(onSwipeRight!);
      }

      const onFinished = (finished?: boolean) => {
        // Run callback after the animation finishes successfully and if
        // we met the threshold.
        if (!fireCallbackBeforeCompletion && finished && metThreshold) {
          if (swipedLeft) scheduleOnRN(onSwipeLeft!);
          else scheduleOnRN(onSwipeRight!);
        }
        // Ensure we reset back to the "rest" position.
        dragX.set(0);
      };

      dragX.set(
        overshootSwipe
          ? withSpring(
              metThreshold ? (swipedLeft ? -1 : 1) * rowWidth.get() : 0,
              {
                clamp: { min: -rowWidth.get(), max: rowWidth.get() },
                overshootClamping: !metThreshold, // Prevents bouncing on failed swipe.
              },
              onFinished,
            )
          : withTiming(0, { duration: 125 }, onFinished),
      );
    },
  });

  const onRowLayout = useCallback(
    (e: LayoutChangeEvent) => rowWidth.set(e.nativeEvent.layout.width),
    [rowWidth],
  );

  const leftIndicator = useMemo(() => {
    if (!onSwipeRight || swipeAmount <= 0) return null;
    return (
      <SwipeIconWrapper
        direction="left"
        maxWidth={rowWidth}
        Icon={LeftIcon}
        dragAmount={dragX}
        className={props.leftIconContainerClassName}
      />
    );
  }, [
    LeftIcon,
    onSwipeRight,
    props.leftIconContainerClassName,
    rowWidth,
    dragX,
    swipeAmount,
  ]);

  const rightIndicator = useMemo(() => {
    if (!onSwipeLeft || swipeAmount >= 0) return null;
    return (
      <SwipeIconWrapper
        direction="right"
        maxWidth={rowWidth}
        Icon={RightIcon}
        dragAmount={dragX}
        className={props.rightIconContainerClassName}
      />
    );
  }, [
    RightIcon,
    onSwipeLeft,
    props.rightIconContainerClassName,
    rowWidth,
    dragX,
    swipeAmount,
  ]);

  const swipeContainerStyles = useAnimatedStyle(() => ({
    transform: [{ translateX: dragX.get() }],
  }));

  return (
    <View className={cn("relative", props.wrapperClassName)}>
      {leftIndicator}
      {rightIndicator}
      <GestureDetector gesture={swipeGesture}>
        <Animated.View
          onLayout={onRowLayout}
          style={swipeContainerStyles}
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
  (
    maxWidth: SharedValue<number>,
    iconWidth: SharedValue<number>,
  ) => [readonly number[], readonly number[]]
> = {
  left: (maxWidth, iconWidth) => {
    "worklet";
    return [
      [0, 1],
      // When `dragX = maxWidth`, we want the icon to be at the half-way point.
      //  - Do things in terms of percent (include offset for icon width).
      [0, (maxWidth.get() - iconWidth.get()) / (2 * maxWidth.get())],
    ];
  },
  right: (maxWidth, iconWidth) => {
    "worklet";
    return [
      [-1, 0],
      [-(maxWidth.get() - iconWidth.get()) / (2 * maxWidth.get()), 0],
    ];
  },
};

function SwipeIconWrapper({
  direction,
  maxWidth,
  dragAmount,
  ...props
}: {
  direction: Direction;
  maxWidth: SharedValue<number>;
  Icon: React.ReactNode;
  dragAmount: SharedValue<number>;
  className?: string;
}) {
  const iconWidth = useSharedValue(0);

  const onIconLayout = useCallback(
    (e: LayoutChangeEvent) => iconWidth.set(e.nativeEvent.layout.width),
    [iconWidth],
  );

  const wrapperStyles = useAnimatedStyle(() => ({ maxWidth: maxWidth.get() }));

  const iconWrapperStyles = useAnimatedStyle(() => ({
    [OnRTLWorklet.decide(...IconPosition[direction])]: 0,
    transform: [
      {
        translateX: interpolate(
          dragAmount.get(),
          ...InterpolateOptions[direction](maxWidth, iconWidth),
        ),
      },
    ],
  }));

  return (
    <Animated.View
      style={wrapperStyles}
      className={cn("absolute h-full w-full justify-center", props.className)}
    >
      <Animated.View
        onLayout={onIconLayout}
        style={iconWrapperStyles}
        className="absolute"
      >
        {props.Icon}
      </Animated.View>
    </Animated.View>
  );
}

function SwipeIcon({ rotate = false }) {
  return (
    <View className={rotate ? "rotate-180" : undefined}>
      <Icon name="nothing-arrow-right" size={32} />
    </View>
  );
}
//#endregion
