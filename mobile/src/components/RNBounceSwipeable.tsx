import { useCallback, useEffect, useRef } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Animated } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

interface RNBounceSwipeableProps {
  children: React.ReactNode;

  /** If we send the item off screen when the swipe action is activated. */
  overshootSwipe?: boolean;

  /** Callback when we swipe to the left. */
  onSwipeLeft?: VoidFunction;
  /** Callback when we swipe to the right. */
  onSwipeRight?: VoidFunction;
}

export function RNBounceSwipeable({
  overshootSwipe = true,
  ...props
}: RNBounceSwipeableProps) {
  const initX = useRef(0);
  const swipeAmount = useRef(0);
  const rowWidth = useRef(0);

  const dragX = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation>(null);

  useEffect(() => {
    const listener = dragX.addListener(
      ({ value }) => (swipeAmount.current = value),
    );
    return () => dragX.removeListener(listener);
  }, [dragX]);

  const swipeGesture = Gesture.Pan()
    // Since we're not using `react-native-reanimated`.
    .runOnJS(true)
    // Allows for scrolling to work without triggering gesture.
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
          props.onSwipeRight ? -rowWidth.current : 0,
        ),
      );
    })
    .onEnd(async () => {
      const metThreshold =
        Math.abs(swipeAmount.current) >= Math.min(100, rowWidth.current / 3);
      const usedRightAction = swipeAmount.current < 0;

      // Cleanup
      initX.current = 0;

      // Create animation the swiped item will translate to.
      const animateToOnSuccess = overshootSwipe
        ? (usedRightAction ? -1 : 1) * rowWidth.current
        : 0;
      animationRef.current = Animated.timing(dragX, {
        duration: 250,
        toValue: metThreshold ? animateToOnSuccess : 0,
        useNativeDriver: true,
      });

      animationRef.current.start(({ finished }) => {
        // Run code if we met the threshold.
        if (finished && metThreshold) {
          if (usedRightAction) props.onSwipeLeft!();
          else props.onSwipeLeft!();
        }
      });
    });

  const onRowLayout = useCallback((e: LayoutChangeEvent) => {
    rowWidth.current = e.nativeEvent.layout.width;
  }, []);

  return (
    <GestureDetector gesture={swipeGesture}>
      <Animated.View
        onLayout={onRowLayout}
        style={{
          transform: [{ translateX: dragX }],
        }}
      >
        {props.children}
      </Animated.View>
    </GestureDetector>
  );
}

//#region Helpers
function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
//#endregion
