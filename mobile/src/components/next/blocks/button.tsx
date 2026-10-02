// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { VariantProps } from "cva/config";

import { cva } from "~/lib/style";
import type { RippleProps } from "../base/ripple";
import { Ripple } from "../base/ripple";
import type { IntentVariant } from "../base/theming";
import { getIntentRippleColor } from "../base/theming";

const buttonStyle = cva({
  base: "min-h-12 flex-row items-center justify-center gap-4 rounded-xl p-4 disabled:opacity-25",
  variants: {
    intent: {
      unset: null,
      muted: null,
      primary: null,
      secondary: null,
      error: null,
    } satisfies IntentVariant,
    filled: { true: "bg-surfaceContainerLowest" },
    outline: { true: "border border-outlineVariant" },
  },
  compoundVariants: [
    { intent: "muted", filled: true, className: "bg-surfaceContainerHigh" },
    { intent: "primary", filled: true, className: "bg-primary" },
    { intent: "secondary", filled: true, className: "bg-secondary" },
    { intent: "error", filled: true, className: "bg-error" },
    { intent: "primary", outline: true, className: "border-primaryDim" },
    { intent: "secondary", outline: true, className: "border-secondaryDim" },
    { intent: "error", outline: true, className: "border-errorDim" },
  ],
  defaultVariants: { intent: "unset", filled: false, outline: false },
});

type ButtonVariants = VariantProps<typeof buttonStyle>;

export interface ButtonProps
  extends Omit<RippleProps, "rippleRadius">, ButtonVariants {}

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
