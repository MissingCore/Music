// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { cn } from "~/lib/style";
import type { AppColor } from "~/modules/customization/theme/core/constants";
import { useColor } from "~/modules/customization/theme/hooks";
import type { PressableProps } from "../../Base/Pressable";
import { Pressable } from "../../Base/Pressable";

type RippleConfig = { rippleColor?: AppColor; rippleRadius?: number };

export type RippleProps = Omit<PressableProps, "android_ripple"> & RippleConfig;

export type RipplePressProps = PressableProps & RippleConfig;

export function Ripple({
  rippleColor,
  rippleRadius,
  className,
  ...props
}: RippleProps) {
  const color = useColor(rippleColor, "surfaceContainerHigh");
  return (
    <Pressable
      {...props}
      android_ripple={{
        //? If an invalid color is provided, Android uses a ripple color
        //? based on the set theme. Since this will mostly happen on the
        //? "Atmosphere Effect" screens, use a 25% opacity white color.
        //? Otherwise, we use 50% opacity of a valid color.
        color: color.length > 7 ? `#FFFFFF40` : `${color}80`,
        foreground: true,
        radius: rippleRadius,
      }}
      className={cn("overflow-hidden", className)}
    />
  );
}
