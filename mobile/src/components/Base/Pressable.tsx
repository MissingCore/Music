// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { memo } from "react";
import type { PressableProps as RNPressableProps } from "react-native";
import { Pressable as RNPresasble } from "react-native";

import { cn } from "~/lib/style";
import type { AppColor } from "~/modules/customization/theme/core/constants";
import { useColor } from "~/modules/customization/theme/hooks";

export type PressableProps = RNPressableProps;
export const Pressable = RNPresasble;

/** The most "used" action props used on `<Pressable />`. */
export type PressProps = Pick<
  PressableProps,
  | "disabled"
  | "delayLongPress"
  | "onLongPress"
  | "onPress"
  | "onPressIn"
  | "onPressOut"
>;

export type RippleProps = Omit<PressableProps, "android_ripple"> & {
  rippleColor?: AppColor;
};

export type RipplePressProps = PressProps & { rippleColor?: AppColor };

export const Ripple = memo(function Ripple({
  rippleColor,
  ...props
}: RippleProps) {
  const color = useColor(rippleColor, "surfaceContainerLowest");
  return (
    <Pressable
      {...props}
      android_ripple={{ color, foreground: true }}
      className={cn("overflow-hidden", props.className)}
    />
  );
});
