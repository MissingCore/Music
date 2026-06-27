// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo, useRef } from "react";
import { usePanGesture } from "react-native-gesture-handler";
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
    transform: [{ rotate: `${convertUnit(timedPosition.get())}deg` }],
  }));

  const vinylWrapperArgs = useMemo(
    () => ({
      ref: wrapperRef,
      onLayout: () => {
        wrapperRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
          center.set({ x: pageX + width / 2, y: pageY + height / 2 });
          radius.set(Math.min(width, height) / 2);
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
      const a = center.get().x - absoluteX;
      const b = center.get().y - absoluteY;
      const c = Math.sqrt(a ** 2 + b ** 2);
      return c <= radius.get();
    },
    [center, radius],
  );

  const getAngle = useCallback(
    ({ absoluteX, absoluteY }: Position) => {
      "worklet";
      return Math.atan2(absoluteY - center.get().y, absoluteX - center.get().x);
    },
    [center],
  );
  //#endregion

  //#region Gesture
  const gestureInBound = useSharedValue(true);
  const prevAngle = useSharedValue(0);
  const hasUpdatedPosition = useSharedValue(false);

  const seekGesture = usePanGesture({
    shouldCancelWhenOutside: true,
    enabled: gestureInBound,
    onActivate: ({ absoluteX, absoluteY }) => {
      if (!isWithinBound({ absoluteX, absoluteY })) {
        return gestureInBound.set(false);
      }

      scheduleOnRN(setIsSeeking, true);
      prevAngle.set(getAngle({ absoluteX, absoluteY }));
    },
    onUpdate: ({ absoluteX, absoluteY }) => {
      if (!isWithinBound({ absoluteX, absoluteY })) {
        return gestureInBound.set(false);
      }

      let currAngle = getAngle({ absoluteX, absoluteY });
      // Ensure arctan calculation is continuous.
      while (currAngle < prevAngle.get() - Math.PI) currAngle += 2 * Math.PI;
      while (currAngle > prevAngle.get() + Math.PI) currAngle -= 2 * Math.PI;
      const rotateAmount = ((currAngle - prevAngle.get()) * 180) / Math.PI;

      prevAngle.set(currAngle);

      // Calculate new position.
      const changeDelta = convertUnit(rotateAmount, "degrees");
      const newPosition = timedPosition.get() + changeDelta;
      if (newPosition < 0) timedPosition.set(0);
      else if (newPosition > duration) timedPosition.set(duration);
      else timedPosition.set(newPosition);

      hasUpdatedPosition.set(true);
    },
    onDeactivate: () => {
      if (hasUpdatedPosition.get())
        scheduleOnRN(PlaybackControls.seekTo, timedPosition.get());
    },
    onFinalize: () => {
      scheduleOnRN(setIsSeeking, false);
      gestureInBound.set(true);
      hasUpdatedPosition.set(false);
    },
  });
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
