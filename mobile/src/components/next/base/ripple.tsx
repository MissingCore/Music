// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { use } from "react";

import { cn } from "~/lib/style";
import { AtmosphereSubtreeContext } from "~/modules/customization/atmosphere/store";
import type { AppColor } from "~/modules/customization/theme/core/constants";
import { useTheme } from "~/modules/customization/theme/hooks";
import type { PressableProps } from "../primitive/pressable";
import { Pressable } from "../primitive/pressable";
import { isHexColor } from "~/modules/customization/theme/utils";

type RippleConfig = { rippleColor?: AppColor };

export type RippleProps = Omit<PressableProps, "android_ripple"> & RippleConfig;

export type RipplePressProps = PressableProps & RippleConfig;

export function Ripple({ rippleColor, className, ...props }: RippleProps) {
  const theme = useTheme();
  const color = isHexColor(rippleColor)
    ? rippleColor
    : theme[rippleColor ?? "surfaceContainerHigh"];
  return (
    <Pressable
      {...props}
      android_ripple={{
        //? If an invalid color is provided, Android uses a ripple color
        //? based on the set theme. Since this will mostly happen on the
        //? "Atmosphere Effect" screens, use a 25% opacity white color.
        //? Otherwise, we use 50% opacity of a valid color.
        color:
          color.length > 7 || use(AtmosphereSubtreeContext)
            ? `#FFFFFF40`
            : `${color}80`,
        foreground: true,
      }}
      className={cn("overflow-hidden", className)}
    />
  );
}
