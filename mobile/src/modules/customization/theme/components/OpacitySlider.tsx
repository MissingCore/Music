// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { I18nManager, ImageBackground } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { alphaToHex, hexToAlpha, withAlpha } from "~/utils/color";
import { CachedSlider } from "~/components/Form/Slider";
import type { HexColor } from "../core/constants";

const HANDLE_SIZE = 20;

export function OpacitySlider(props: {
  color: HexColor;
  value: string;
  onComplete: (hex: string) => void;
}) {
  const alpha = useSharedValue(1);

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
        colors={[withAlpha(props.color, 0), props.color]}
        start={[0, 0]}
        end={[1, 0]}
        className="insets-0 absolute size-full"
      />
      <Animated.View
        style={sliderHandleStyle}
        className="absolute top-1/2 rounded-full border-2 border-black ltr:left-0 rtl:right-0"
      />

      <CachedSlider
        {...SliderConfig}
        liveValue={alpha} //? Will override the initial value.
        onComplete={(alpha) => props.onComplete(alphaToHex(alpha))}
        inverted={I18nManager.isRTL}
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

//#endregion
