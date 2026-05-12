import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useRef, useState } from "react";
import { Gesture } from "react-native-gesture-handler";
import type Animated from "react-native-reanimated";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls } from "~/stores/Playback/actions";

import { animatedPositionAtom, isSeekingAtom } from "./Seekbar.context";

type Position = { absoluteX: number; absoluteY: number };

export function useVinylSeekbar() {
  const activeTrack = usePlaybackStore((s) => s.activeTrack);
  const duration = activeTrack?.duration ?? 0;

  const timedPosition = useAtomValue(animatedPositionAtom);
  const setIsSeeking = useSetAtom(isSeekingAtom);

  //#region Layout Calculation + Vinyl Styling
  const wrapperRef = useRef<Animated.View>(null);
  const center = useSharedValue({ x: 0, y: 0 });
  const radius = useSharedValue(0);

  const vinylStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${convertUnit(timedPosition.value)}deg` }],
  }));

  const vinylWrapperArgs = useMemo(
    () => ({
      ref: wrapperRef,
      onLayout: () => {
        wrapperRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
          center.value = { x: pageX + width / 2, y: pageY + height / 2 };
          radius.value = Math.min(width, height) / 2;
        });
      },
      style: vinylStyle,
    }),
    [center, radius, vinylStyle],
  );
  //#endregion

  //#region Handlers
  const isWithinBound = useCallback(
    ({ absoluteX, absoluteY }: Position) => {
      "worklet";
      const a = center.value.x - absoluteX;
      const b = center.value.y - absoluteY;
      const c = Math.sqrt(a ** 2 + b ** 2);
      return c <= radius.value;
    },
    [center, radius],
  );

  const getAngle = useCallback(
    ({ absoluteX, absoluteY }: Position) => {
      "worklet";
      return Math.atan2(absoluteY - center.value.y, absoluteX - center.value.x);
    },
    [center],
  );
  //#endregion

  //#region Gesture
  const [gestureInBound, setGestureInBound] = useState(true);
  const prevAngle = useSharedValue(0);
  const hasUpdatedPosition = useSharedValue(false);

  const seekGesture = useMemo(
    () =>
      Gesture.Pan()
        .shouldCancelWhenOutside(true)
        .enabled(gestureInBound)
        .onStart(({ absoluteX, absoluteY }) => {
          if (isWithinBound({ absoluteX, absoluteY })) {
            scheduleOnRN(setIsSeeking, true);
            prevAngle.value = getAngle({ absoluteX, absoluteY });
          } else {
            scheduleOnRN(setGestureInBound, false);
          }
        })
        .onUpdate(({ absoluteX, absoluteY }) => {
          if (isWithinBound({ absoluteX, absoluteY })) {
            let currAngle = getAngle({ absoluteX, absoluteY });
            // Ensure arctan calculation is continuous.
            while (currAngle < prevAngle.value - Math.PI)
              currAngle += 2 * Math.PI;
            while (currAngle > prevAngle.value + Math.PI)
              currAngle -= 2 * Math.PI;
            const rotateAmount =
              ((currAngle - prevAngle.value) * 180) / Math.PI;

            prevAngle.value = currAngle;

            // Calculate new position.
            const changeDelta = convertUnit(rotateAmount, "degrees");
            const newPosition = timedPosition.value + changeDelta;
            if (newPosition < 0) timedPosition.value = 0;
            else if (newPosition > duration) timedPosition.value = duration;
            else timedPosition.value = newPosition;

            hasUpdatedPosition.value = true;
          } else {
            scheduleOnRN(setGestureInBound, false);
          }
        })
        .onEnd(() => {
          if (hasUpdatedPosition.value)
            scheduleOnRN(PlaybackControls.seekTo, timedPosition.value);
        })
        .onFinalize(() => {
          scheduleOnRN(setIsSeeking, false);
          scheduleOnRN(setGestureInBound, true);
          hasUpdatedPosition.value = false;
        }),
    [
      isWithinBound,
      getAngle,
      setIsSeeking,
      timedPosition,
      duration,
      prevAngle,
      hasUpdatedPosition,
      gestureInBound,
    ],
  );
  //#endregion

  return useMemo(
    () => ({ seekGesture, vinylWrapperArgs }),
    [seekGesture, vinylWrapperArgs],
  );
}

//#region Utils
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
//#endregion
