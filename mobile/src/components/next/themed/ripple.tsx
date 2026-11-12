// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { colord } from "colord";

import { cn } from "~/lib/style";
import { adjustTone } from "~/utils/color";
import type { AppColor } from "~/modules/customization/theme/core/constants";
import { useColor } from "~/modules/customization/theme/core/context";
import type { PressableProps } from "../primitive/pressable";
import { Pressable } from "../primitive/pressable";

type RippleConfig = {
  /** The color of the surface the ripple will be on. Defaults to `surfaceContainerLowest`. */
  surfaceColor?: AppColor;
  /** How opaque we want the ripple to be. Defaults to `0.5`. */
  alpha?: number;
};

export type RippleProps = Omit<PressableProps, "android_ripple"> & RippleConfig;

export type RipplePressProps = PressableProps & RippleConfig;

export function Ripple({
  surfaceColor,
  alpha,
  className,
  ...props
}: RippleProps) {
  const derivedSurfaceColor = useColor(
    surfaceColor ?? "surfaceContainerLowest",
  );
  return (
    <Pressable
      {...props}
      android_ripple={{
        color: adjustTone(colord(derivedSurfaceColor), 0.15)
          .alpha(alpha ?? 0.5)
          .toHex(),
        foreground: true,
      }}
      className={cn("overflow-hidden", className)}
    />
  );
}
