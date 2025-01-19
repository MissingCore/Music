import { useCallback, useRef } from "react";
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

import { useMusicStore } from "@/modules/media/services/Music";
import { useSeekStore } from "@/screens/NowPlaying/SeekService";

/** Controls the rotation of the vinyl on the "Now Playing" screen. */
export function useVinylSeekbar({
  center,
}: {
  /** Coordinates pointing to the center of the vinyl. */
  center: { x: number; y: number };
}) {
  const { position } = useProgress(200);
  const activeTrack = useMusicStore((state) => state.activeTrack);
  const sliderPos = useSeekStore((state) => state.sliderPos);

  const hasMounted = useRef(false);
  /** Rotation progress based on `position`. */
  const rotationProgress = useSharedValue(0);
  /** Rotation progress based on "seeking" on vinyl. */
  const seekProgress = useSharedValue<number | null>(null);
  /** Number of seconds we need to move by. */
  const cueAmount = useSharedValue(0);
  const prevAngle = useSharedValue(0);

  const onEnd = useCallback(async (movedAmount: number) => {
    await TrackPlayer.seekBy(movedAmount);
  }, []);

  //#region True Position
  if (position === 0) {
    // Reset animation when position goes back to 0s.
    cancelAnimation(rotationProgress);
    rotationProgress.value = 0;
  } else if (position < (activeTrack?.duration ?? 0) - 1) {
    rotationProgress.value = withTiming(
      ((sliderPos ?? position) * 360) / 24,
      // Prevent vinyl rotation on mount.
      { duration: hasMounted.current ? 500 : 0, easing: Easing.linear },
    );
    if (!hasMounted.current) hasMounted.current = true;
  } else {
    // Cancel animation ~1s before the end due to weird behaviors if
    // the following image is large in size (ie: "animation spike").
    cancelAnimation(rotationProgress);
  }
  //#endregion

  const seekGesture = Gesture.Pan()
    .onStart(({ absoluteX, absoluteY }) => {
      cancelAnimation(rotationProgress);
      seekProgress.value = rotationProgress.value;
      prevAngle.value = Math.atan2(absoluteY - center.y, absoluteX - center.x);
    })
    .onUpdate(({ absoluteX, absoluteY }) => {
      let currAngle = Math.atan2(absoluteY - center.y, absoluteX - center.x);
      while (currAngle < prevAngle.value - Math.PI) currAngle += 2 * Math.PI;
      while (currAngle > prevAngle.value + Math.PI) currAngle -= 2 * Math.PI;
      const difference = currAngle - prevAngle.value;
      prevAngle.value = currAngle;

      seekProgress.value =
        (seekProgress.value ?? 0) + (difference * 180) / Math.PI;
      // Convert `difference` to duration represented by duration.
      cueAmount.value = cueAmount.value + (difference * 24) / (2 * Math.PI);
    })
    .onEnd(() => {
      runOnJS(onEnd)(cueAmount.value);
      rotationProgress.value = seekProgress.value ?? 0;
      cueAmount.value = 0;
      seekProgress.value = null;
    });

  const vinylStyle = useAnimatedStyle(() => {
    const rotateAmount = seekProgress.value ?? rotationProgress.value;
    return { transform: [{ rotate: `${rotateAmount}deg` }] };
  });

  return { vinylStyle, seekGesture };
}
