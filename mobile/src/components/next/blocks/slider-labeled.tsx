// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useState } from "react";
import { I18nManager, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { SliderOptions } from "../base/slider-context";
import { useSlider } from "../base/slider-context";
import { Text } from "../base/typography";

export interface LabeledSliderProps extends Omit<SliderOptions, "inverted"> {
  label: string;
  /** Worklet function to format value for display. */
  formatValue: (value: number) => string;
}

export function LabeledSlider({
  label,
  formatValue,
  ...props
}: LabeledSliderProps) {
  const { sliderRef, sliderUnitLength, value, gestures } = useSlider({
    inverted: I18nManager.isRTL,
    ...props,
  });

  const [displayValue, setDisplayValue] = useState("");
  useDerivedValue(() => {
    scheduleOnRN(setDisplayValue, formatValue(value.get()));
  });

  const animatedStyles = useAnimatedStyle(() => ({
    width: sliderUnitLength.get() * (value.get() - 1),
  }));

  return (
    <GestureDetector gesture={gestures}>
      <Animated.View
        collapsable={false}
        ref={sliderRef}
        className="relative h-12 w-full flex-row items-center justify-between gap-16 overflow-hidden rounded-lg border border-outlineVariant bg-surfaceContainerLowest px-2"
      >
        <View className="absolute inset-0 flex-row items-center">
          <Animated.View
            style={animatedStyles}
            className="h-full rounded-r-lg bg-surfaceContainerHigh/50"
          />
          <View className="h-6 w-1 rounded-full bg-onSurfaceVariant" />
        </View>
        <Text numberOfLines={1} size="sm">
          {label}
        </Text>
        <Text
          style={{ fontVariant: ["tabular-nums"] }}
          size="sm"
          className="shrink-0"
        >
          {displayValue}
        </Text>
      </Animated.View>
    </GestureDetector>
  );
}
