import { useCallback, useMemo, useRef } from "react";
import type { LayoutChangeEvent } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import TrackPlayer, { useProgress } from "react-native-track-player";

import { useMusicStore } from "~/modules/media/services/Music";
import { useSeekStore } from "~/screens/NowPlaying/SeekService";

/** Controls the rotation of the vinyl on the "Now Playing" screen. */
export function useVinylSeekbar() {
  const { position } = useProgress(200);
  const activeTrack = useMusicStore((state) => state.activeTrack);
  const sliderPos = useSeekStore((state) => state.sliderPos);
  const setSliderPos = useSeekStore((state) => state.setSliderPos);

  const hasMounted = useRef(false);
  // Coordinates pointing to the center of the vinyl.
  const centerX = useSharedValue(0);
  const centerY = useSharedValue(0);

  // Rotation progress based on `position`.
  const trueProgress = useSharedValue(0);
  // Rotation progress based on "seeking" on vinyl.
  const seekProgress = useSharedValue<number | null>(null);
  const prevAngle = useSharedValue(0);

  const duration = useMemo(() => activeTrack?.duration ?? 0, [activeTrack]);
  const maxDegrees = useMemo(() => convertUnit(duration), [duration]);

  /**
   * Obtain the center coordinate of the vinyl which is used to calculate
   * the angles used to determine seek progress.
   */
  const initCenter = useCallback(
    ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
      centerX.value = layout.x + layout.width / 2;
      centerY.value = layout.y + layout.height / 2;
    },
    [centerX, centerY],
  );

  const onEnd = useCallback(
    async (seconds: number) => {
      await TrackPlayer.seekTo(seconds);
      trueProgress.value = convertUnit(seconds);
      seekProgress.value = null;
      // Helps prevents "rubberbanding" in seekbar.
      setTimeout(() => setSliderPos(null), 250);
    },
    [setSliderPos, seekProgress, trueProgress],
  );

  const renderedPosition = sliderPos ?? position;
  if (renderedPosition === 0) {
    // Reset animation when position goes back to 0s.
    cancelAnimation(trueProgress);
    trueProgress.value = 0;
  } else if (renderedPosition < duration - 1) {
    trueProgress.value = withTiming(
      convertUnit(renderedPosition),
      // Prevent vinyl rotation on mount.
      { duration: hasMounted.current ? 500 : 0, easing: Easing.linear },
    );
    if (!hasMounted.current) hasMounted.current = true;
  } else {
    // Cancel animation ~1s before the end due to weird behaviors if
    // the following image is large in size (ie: "animation spike").
    cancelAnimation(trueProgress);
  }

  const seekGesture = Gesture.Pan()
    .shouldCancelWhenOutside(true)
    .hitSlop(32)
    .onStart(({ absoluteX, absoluteY }) => {
      runOnJS(setSliderPos)(position);
      seekProgress.value = convertUnit(position);
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
      runOnJS(setSliderPos)(convertUnit(seekProgress.value, "degrees"));

      prevAngle.value = currAngle;
    })
    .onEnd(() => {
      runOnJS(onEnd)(convertUnit(seekProgress.value ?? 0, "degrees"));
    });

  const vinylStyle = useAnimatedStyle(() => {
    const rotateAmount = seekProgress.value ?? trueProgress.value;
    return { transform: [{ rotate: `${rotateAmount}deg` }] };
  });

  return { initCenter, vinylStyle, seekGesture };
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
