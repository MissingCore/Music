// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { colord } from "colord";

import { useColor } from "~/_next/context/theme-context";

import type { AppColor } from "~/_next/constants/theme";
import { adjustLightness } from "~/_next/utils/color";
import { cn } from "~/_next/utils/style";
import type { PressableProps } from "./primitives/pressable";
import { Pressable } from "./primitives/pressable";

export interface RippleProps extends Omit<PressableProps, "android_ripple"> {
  /** The color of the "surface" the ripple will be on. */
  color?: AppColor;
  /** How transparent the ripple will be. */
  alpha?: number;
}

export function Ripple({
  color = "background",
  alpha = 0.4,
  className,
  ...props
}: RippleProps) {
  const rippleColor = useColor(color);
  return (
    <Pressable
      {...props}
      android_ripple={{
        color: adjustLightness(colord(rippleColor)).alpha(alpha).toHex(),
        foreground: true,
      }}
      className={cn("overflow-hidden", className)}
    />
  );
}
