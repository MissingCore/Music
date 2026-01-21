import { useAtomValue } from "jotai";
import { useMemo, useRef } from "react";
import type Animated from "react-native-reanimated";

import { animatedPositionAtom } from "./Seekbar.context";
import { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

export function useVinylSeekbar() {
  const timedPosition = useAtomValue(animatedPositionAtom);

  //#region Layout Calculation + Vinyl Styling
  const wrapperRef = useRef<Animated.View>(null);
  const center = useSharedValue({ x: 0, y: 0 });
  const radius = useSharedValue(0);

  const vinylStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${convertUnit(timedPosition.value, "seconds")}deg` },
    ],
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

  return useMemo(() => ({ vinylWrapperArgs }), [vinylWrapperArgs]);
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
