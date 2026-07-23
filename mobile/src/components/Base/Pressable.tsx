// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { memo } from "react";
import type { PressableProps as RNPressableProps } from "react-native";
import { Pressable as RNPressable } from "react-native";

import { cn } from "~/lib/style";
import type { AppColor } from "~/modules/customization/theme/core/constants";
import { useColor } from "~/modules/customization/theme/hooks";

export type PressableProps = RNPressableProps;
export const Pressable = RNPressable;

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

type RippleConfig = { rippleColor?: AppColor; rippleRadius?: number };

export type RippleProps = Omit<PressableProps, "android_ripple"> & RippleConfig;

export type RipplePressProps = PressProps & RippleConfig;

export const Ripple = memo(function Ripple({
  rippleColor,
  rippleRadius,
  ...props
}: RippleProps) {
  const color = useColor(rippleColor, "surfaceContainerHigh");
  return (
    <Pressable
      {...props}
      android_ripple={{ color, foreground: true, radius: rippleRadius }}
      className={cn("overflow-hidden", props.className)}
    />
  );
});
