// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { LinearGradient } from "expo-linear-gradient";
import { useCallback } from "react";
import { Image, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useSlider } from "~/components/next/base/slider-context";
import type { HexColor } from "../core/constants";

const HANDLE_SIZE = 20;
const OPACITY_SLIDER_HEIGHT = HANDLE_SIZE + 8;

export function OpacitySlider({
  color,
  value,
  onComplete,
}: {
  color: HexColor;
  value: string;
  onComplete: (hex: string) => void;
}) {
  const processOpacityValue = useCallback(
    (value: number) => onComplete(alphaToHex(value)),
    [onComplete],
  );

  const {
    measureSlider,
    sliderLength,
    value: alpha,
    gestures,
  } = useSlider({
    initValue: hexToAlpha(value),
    min: 0,
    max: 1,
    step: 0.01,
    onComplete: (value) => {
      "worklet";
      scheduleOnRN(processOpacityValue, value);
    },
  });

  const sliderHandleStyle = useAnimatedStyle(() => ({
    height: HANDLE_SIZE,
    width: HANDLE_SIZE,
    transform: [
      { translateX: alpha.get() * (sliderLength.get() - HANDLE_SIZE) },
      { translateY: "-50%" },
    ],
  }));

  return (
    <GestureDetector gesture={gestures}>
      <View
        collapsable={false}
        onLayout={measureSlider}
        style={{ height: OPACITY_SLIDER_HEIGHT }}
        className="relative overflow-hidden rounded-full"
      >
        <Image
          source={require("~/resources/images/transparent-texture.png")}
          resizeMode="repeat"
          className="absolute inset-0 w-full"
        />
        <LinearGradient
          colors={[`${color}00`, color]}
          start={[0, 0]}
          end={[1, 0]}
          className="absolute inset-0 size-full"
        />
        <Animated.View
          style={sliderHandleStyle}
          className="absolute top-1/2 rounded-full border-2 border-black ltr:left-0 rtl:right-0"
        />
      </View>
    </GestureDetector>
  );
}

//#region Helpers
/** Returns a value between 0 (0x00) & 1 (0xFF), rounded to 2 decimal places. */
export function hexToAlpha(hex: string) {
  if (hex.length !== 2) return 1;
  return +(parseInt(hex, 16) / 255).toFixed(2);
}

/** Returns a value between 0x00 (0) & 0xFF (1). */
function alphaToHex(alpha: number) {
  if (alpha < 0 || alpha > 1) return "FF";
  return Math.round(alpha * 255) // Round to prevent hexadecimal fractions
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
}
//#endregion
