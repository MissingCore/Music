// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { LinearGradient } from "expo-linear-gradient";
import { useCallback } from "react";
import { Image, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { alphaToHex, hexToAlpha, withAlpha } from "~/utils/color";
import { useSlider } from "~/components/next/base/slider-context";
import type { HexColor } from "../core/constants";

const HANDLE_SIZE = 20;
const OPACITY_SLIDER_HEIGHT = HANDLE_SIZE + 8;

export function OpacitySlider({
  color,
  value: hexColor,
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

  const { measureSlider, sliderLength, value, gestures } = useSlider({
    initValue: hexToAlpha(hexColor),
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
      {
        translateX: value.get() * (sliderLength.get() - HANDLE_SIZE),
      },
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
          colors={[withAlpha(color, 0), color]}
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
