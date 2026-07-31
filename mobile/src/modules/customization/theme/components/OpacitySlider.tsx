// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { ImageBackground } from "react-native";
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { CachedSlider } from "~/components/Form/Slider";
import type { HexColor } from "../core/constants";

const HANDLE_SIZE = 20;

export function OpacitySlider(props: {
  color: HexColor;
  value: string;
  onComplete: (hex: string) => void;
}) {
  const alpha = useSharedValue(1);
  const [_alpha, _setAlpha] = useState(1);
  useAnimatedReaction(
    () => alpha.get(),
    (currVal) => scheduleOnRN(_setAlpha, currVal),
  );

  useEffect(() => {
    alpha.set(hexToAlpha(props.value));
  }, [alpha, props.value]);

  const contentWidth = useSharedValue(0);
  const sliderHandleStyle = useAnimatedStyle(() => ({
    height: HANDLE_SIZE,
    width: HANDLE_SIZE,
    transform: [
      { translateX: alpha.get() * (contentWidth.get() - HANDLE_SIZE) },
      { translateY: "-50%" },
    ],
  }));

  return (
    <ImageBackground
      onLayout={(e) => contentWidth.set(e.nativeEvent.layout.width)}
      source={require("~/resources/images/transparent-texture.png")}
      imageStyle={{ resizeMode: "repeat" }}
      className="relative overflow-hidden rounded-full"
    >
      <LinearGradient
        colors={[`${props.color}00`, props.color]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 1 }}
        className="insets-0 absolute size-full"
      />
      <Animated.View
        style={sliderHandleStyle}
        className="absolute top-1/2 left-0 rounded-full border-2 border-black"
      />

      <CachedSlider
        {...SliderConfig}
        liveValue={alpha} //? Will override the initial value.
        onComplete={(alpha) => props.onComplete(alphaToHex(alpha))}
      />
    </ImageBackground>
  );
}

//#region Helpers
const SliderConfig = {
  initValue: 1,
  min: 0,
  max: 1,
  step: 0.01,
  thickness: 28,
  transparent: true,
};

/** Returns a value between 0 (0x00) & 1 (0xFF), rounded to 2 decimal places. */
function hexToAlpha(hex: string) {
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
