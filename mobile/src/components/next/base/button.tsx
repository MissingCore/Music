// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { VariantProps } from "cva/config";

import { cva } from "~/lib/style";
import type { RippleProps } from "./ripple";
import { Ripple } from "./ripple";
import { baseContainerStyle, getIntentRippleColor } from "./styles";

const buttonStyle = cva({
  composes: [baseContainerStyle],
  base: "min-h-10 flex-row items-center justify-center gap-4 rounded-xl p-4 disabled:opacity-25",
});

export interface ButtonProps
  extends RippleProps, VariantProps<typeof buttonStyle> {}

export function Button({
  intent,
  filled,
  outline,
  className,
  rippleColor,
  ...props
}: ButtonProps) {
  return (
    <Ripple
      {...props}
      rippleColor={rippleColor ?? getIntentRippleColor(intent)}
      className={buttonStyle({ intent, filled, outline, className })}
    />
  );
}
