import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import type Animated from "react-native-reanimated";
import {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { useMusicStore } from "~/modules/media/services/Music";
import { usePlayerProgress } from "./usePlayerProgress";

/** Controls the rotation of the vinyl on the "Now Playing" screen. */
export function useVinylSeekbar() {
  const { position, setPosition, seekToPosition } = usePlayerProgress();
  const activeTrack = useMusicStore((state) => state.activeTrack);

  const wrapperRef = useRef<Animated.View>(null);
  const hasMounted = useRef(false);
  const [isActive, setIsActive] = useState(false);
  // Coordinates pointing to the center of the vinyl.
  const centerX = useSharedValue(0);
  const centerY = useSharedValue(0);

  // The position we've backgrounded the app at.
  const [bgPosition, setBgPosition] = useState<number | null>(null);
  // Rotation progress based on `position`.
  const trueProgress = useSharedValue(0);
  // Rotation progress based on "seeking" on vinyl.
  const seekProgress = useSharedValue<number | null>(null);
  const prevAngle = useSharedValue(0);
  // Angle to debounce `runOnJS`.
  const debounceAngle = useSharedValue<number | null>(null);

  const duration = useMemo(() => activeTrack?.duration ?? 0, [activeTrack]);
  const maxDegrees = useMemo(() => convertUnit(duration), [duration]);

  /**
   * Obtain the center coordinate of the vinyl which is used to calculate
   * the angles used to determine seek progress.
   */
  const initCenter = useCallback(() => {
    wrapperRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      centerX.value = pageX + width / 2;
      centerY.value = pageY + height / 2;
    });
  }, [centerX, centerY]);

  const onEnd = useCallback(
    async (seconds: number) => {
      await seekToPosition(seconds);
      trueProgress.value = convertUnit(seconds);
      debounceAngle.value = seekProgress.value = null;
    },
    [debounceAngle, seekToPosition, seekProgress, trueProgress],
  );

  // To help ensure the vinyl doesn't spin fast to its new position afer
  // opening the app from backgrounding on the "Now Playing" screen.
  if (AppState.currentState !== "active" && bgPosition === null) {
    setBgPosition(position);
  }

  useEffect(() => {
    if (position === 0) {
      // Reset animation when position goes back to 0s.
      cancelAnimation(trueProgress);
      trueProgress.value = 0;
    } else if (position < duration - 1) {
      const resumedFromBackground =
        bgPosition !== null ? Math.abs(position - bgPosition) > 2 : false;
      // Prevent vinyl rotation on mount.
      const animateSpin = hasMounted.current && !resumedFromBackground;
      trueProgress.value = withTiming(convertUnit(position), {
        duration: animateSpin ? 500 : 0,
        easing: Easing.linear,
      });
      if (!hasMounted.current) hasMounted.current = true;
    } else {
      // Cancel animation ~1s before the end due to weird behaviors if
      // the following image is large in size (ie: "animation spike").
      cancelAnimation(trueProgress);
    }

    if (bgPosition !== null) setBgPosition(null);
  }, [duration, position, bgPosition, trueProgress]);

  const seekGesture = Gesture.Pan()
    .shouldCancelWhenOutside(true)
    .hitSlop(32)
    .onStart(({ absoluteX, absoluteY }) => {
      runOnJS(setIsActive)(true);
      runOnJS(setPosition)(position);
      debounceAngle.value = seekProgress.value = convertUnit(position);
      prevAngle.value = Math.atan2(
        absoluteY - centerY.value,
        absoluteX - centerX.value,
      );
    })
    .onUpdate(({ absoluteX, absoluteY }) => {
      let currAngle = Math.atan2(
        absoluteY - centerY.value,
        absoluteX - centerX.value,
      );
      // Ensure arctan calculation is continuous.
      while (currAngle < prevAngle.value - Math.PI) currAngle += 2 * Math.PI;
      while (currAngle > prevAngle.value + Math.PI) currAngle -= 2 * Math.PI;
      // Calculate new rotation position.
      const rotateAmount = ((currAngle - prevAngle.value) * 180) / Math.PI;
      const newPosition = (seekProgress.value ?? 0) + rotateAmount;
      if (newPosition < 0) seekProgress.value = 0;
      else if (newPosition > maxDegrees) seekProgress.value = maxDegrees;
      else seekProgress.value = newPosition;

      // Only run `setSliderPos` when we've rotated ~15deg (which is ~1s).
      if (Math.abs((debounceAngle.value ?? 0) - seekProgress.value) > 15) {
        runOnJS(setPosition)(convertUnit(seekProgress.value, "degrees"));
        debounceAngle.value = seekProgress.value;
      }
      prevAngle.value = currAngle;
    })
    .onEnd(() => {
      runOnJS(setIsActive)(false);
      runOnJS(onEnd)(convertUnit(seekProgress.value ?? 0, "degrees"));
    });

  const vinylStyle = useAnimatedStyle(() => {
    const rotateAmount = seekProgress.value ?? trueProgress.value;
    return { transform: [{ rotate: `${rotateAmount}deg` }] };
  });

  return { wrapperRef, isActive, initCenter, vinylStyle, seekGesture };
}

/**
 * Convert between seconds and the degrees representing the rotated state
 * of the vinyl. 1 full revolution (360deg) is 24s.
 *
 * **DEFAULTS** to converting seconds to degrees.
 */
function convertUnit(value: number, from?: "seconds" | "degrees") {
  "worklet";
  if (from === "degrees") return value * (24 / 360);
  return value * (360 / 24);
}
