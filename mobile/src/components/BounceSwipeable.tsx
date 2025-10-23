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
  /** Callback when we swipe to the right. */
  onSwipeRight?: VoidFunction;
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
  LeftIndicator = <SwipeIndicator rotate />,
  RightIndicator = <SwipeIndicator />,
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
      dragX.setValue(
        clamp(
          props.onSwipeLeft ? -rowWidth.current : 0,
          absoluteX - initX.current,
          props.onSwipeRight ? rowWidth.current : 0,
        ),
      );
    })
    .onEnd(({ absoluteX }) => {
      // When swiping very fast and since we're updating `swipeAmount`
      // on the JS thread so it can be read, `swipeAmount` may not actually
      // contain the value represented by the pan gesture.
      const trueSwipeAmount = absoluteX - initX.current;
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
      <View
        style={{
          maxWidth: rowWidth.current,
          alignItems: OnRTL.decide("flex-end", "flex-start"),
        }}
        className="absolute h-full w-full"
      >
        {LeftIndicator}
      </View>
    );
  }, [LeftIndicator, props.onSwipeRight, swipeAmount]);

  const rightIndicator = useMemo(() => {
    if (!props.onSwipeLeft || swipeAmount >= 0) return null;
    return (
      <View
        style={{
          maxWidth: rowWidth.current,
          alignItems: OnRTL.decide("flex-start", "flex-end"),
        }}
        className="absolute h-full w-full"
      >
        {RightIndicator}
      </View>
    );
  }, [RightIndicator, props.onSwipeLeft, swipeAmount]);

  return (
    <View className={cn("relative", props.wrapperClassName)}>
      {leftIndicator}
      {rightIndicator}
      <GestureDetector gesture={swipeGesture}>
        <Animated.View
          onLayout={onRowLayout}
          style={{
            transform: [{ translateX: dragX }],
          }}
          className={props.className}
        >
          {props.children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

function SwipeIndicator({ rotate = false }) {
  const { foreground } = useTheme();
  return (
    <View className="h-full justify-center">
      <View
        className={cn(OnRTL.decide("pl-3", "pr-3"), { "rotate-180": rotate })}
      >
        <NothingArrowRight size={32} color={foreground} />
      </View>
    </View>
  );
}

//#region Helpers
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
//#endregion
