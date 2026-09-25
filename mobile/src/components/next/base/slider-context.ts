// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useCallback, useMemo } from "react";
import type { LayoutChangeEvent } from "react-native";

import type { ComposedGesture } from "react-native-gesture-handler";
import {
  useCompetingGestures,
  usePanGesture,
  useTapGesture,
} from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import {
  clamp,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type SliderStatus = "idle" | "busy";

export interface SliderOptions {
  initValue: number;
  min: number;
  max: number;
  /** Defaults to `1`. */
  step?: number;
  /** Defaults to `true`. */
  enabled?: boolean;

  /** If the gesture should go in the opposite direction. */
  inverted?: boolean;

  /** Worklet function called when `value` changes. */
  onChange?: (value: number) => void | Promise<void>;
  /** Worklet function called when interaction ends. Fallbacks to `onChange`. */
  onComplete?: (value: number) => void | Promise<void>;
  /** Worklet function fired when the status of the slider changes. */
  onStatusChange?: (status: SliderStatus) => void | Promise<void>;
}

interface SliderConfigs {
  /** Pass to the `onLayout` prop on the slider. */
  measureSlider: (e: LayoutChangeEvent) => void;
  /** Distance on slider to move `1`. */
  sliderUnitLength: SharedValue<number>;

  value: SharedValue<number>;
  gestures: ComposedGesture;
}

export function useSlider({
  initValue,
  min,
  max,
  step = 1,
  enabled = true,
  inverted = false,
  onChange,
  onComplete: _onComplete,
  onStatusChange,
}: SliderOptions): SliderConfigs {
  const value = useSharedValue(initValue);
  const range = max - min;
  const onComplete = _onComplete ?? onChange;

  //#region Measurement
  const sliderLength = useSharedValue(0);
  const measureSlider = useCallback(
    (e: LayoutChangeEvent) => sliderLength.set(e.nativeEvent.layout.width),
    [sliderLength],
  );

  // Length on slider to represent moving `1`.
  const sliderUnitLength = useDerivedValue(() => sliderLength.get() / range);
  //#endregion

  const calculateNextValue = useCallback(
    (l: number) => {
      "worklet";
      const adjustedL = inverted ? sliderLength.get() - l : l;
      const clampedValue = clamp(adjustedL, 0, sliderLength.get());
      const progressPercent = clampedValue / sliderLength.get();
      return roundToStep(progressPercent * range + min, step);
    },
    [min, range, step, inverted, sliderLength],
  );

  //#region Debouncing
  const debounceTimer = useSharedValue(0);
  const priorDebounceValue = useSharedValue<number | null>(null);

  const clearDebounce = useCallback(() => {
    "worklet";
    debounceTimer.set(0);
    priorDebounceValue.set(null);
  }, [debounceTimer, priorDebounceValue]);

  const debouncedOnChange = useCallback(
    (nextVal: number) => {
      "worklet";
      if (priorDebounceValue.get() === nextVal) return;
      priorDebounceValue.set(nextVal);
      debounceTimer.set(
        withTiming(1, { duration: 50 }, (finished) => {
          if (!finished) return;
          onChange?.(nextVal);
          clearDebounce();
        }),
      );
    },
    [onChange, debounceTimer, priorDebounceValue, clearDebounce],
  );
  //#endregion

  //#region Gestures
  const tapGesture = useTapGesture({
    enabled,
    onBegin: () => onStatusChange?.("busy"),
    onDeactivate: ({ x }) => {
      const finalizedValue = calculateNextValue(x);
      value.set(finalizedValue);
      onComplete?.(finalizedValue);
    },
    onFinalize: () => onStatusChange?.("idle"),
  });

  const panGesture = usePanGesture({
    enabled,
    activeOffsetX: [-10, 10],
    onBegin: () => onStatusChange?.("busy"),
    onUpdate: ({ x }) => {
      const nextValue = calculateNextValue(x);
      value.set(nextValue);
      debouncedOnChange(nextValue);
    },
    onDeactivate: ({ x }) => {
      const finalizedValue = calculateNextValue(x);
      value.set(finalizedValue);
      clearDebounce();
      onComplete?.(finalizedValue);
    },
    onFinalize: () => onStatusChange?.("idle"),
  });

  const gestures = useCompetingGestures(tapGesture, panGesture);
  //#endregion

  return useMemo(
    () => ({ measureSlider, sliderUnitLength, value, gestures }),
    [measureSlider, sliderUnitLength, value, gestures],
  );
}

//#region Internal Helpers
function roundToStep(rawNum: number, step: number) {
  "worklet";
  const roundedVal = Math.round(rawNum / step) * step;

  // Figure out number of decimal places we round to.
  const stepStr = step.toString();
  const decimalPlaces = stepStr.includes(".")
    ? stepStr.split(".").at(-1)!.length
    : 0;

  if (decimalPlaces === 0) return roundedVal;
  return parseFloat(roundedVal.toFixed(decimalPlaces));
}
//#endregion
