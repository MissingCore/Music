// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { VariantProps } from "cva/config";
import { use } from "react";
import type { ViewProps } from "react-native";
import { View } from "react-native";

import { cva } from "~/lib/style";
import type { IntentVariant } from "./context";
import { ThemeIntentContext } from "./context";

export const cardStyle = cva({
  base: "rounded-3xl bg-surfaceContainerLowest",
  variants: {
    intent: {
      unset: null,
      muted: "bg-surfaceContainerHigh",
      primary: "bg-primary",
      secondary: "bg-secondary",
      error: "bg-error",
    } satisfies IntentVariant,
    padding: { true: "p-4" },
    //! Will not apply to `outline` if it's also enabled.
    inverse: { true: "bg-inverseSurface" },
    outline: { true: "border border-outlineVariant" },
    overflow: { false: "overflow-hidden" },
  },
  compoundVariants: [
    { intent: "primary", inverse: true, className: "bg-onPrimary" },
    { intent: "secondary", inverse: true, className: "bg-onSecondary" },
    { intent: "error", inverse: true, className: "bg-onError" },
    { intent: "primary", outline: true, className: "border-primaryDim" },
    { intent: "secondary", outline: true, className: "border-secondaryDim" },
    { intent: "error", outline: true, className: "border-errorDim" },
  ],
  defaultVariants: {
    intent: "unset",
    padding: true,
    outline: false,
    overflow: false,
  },
});

export type CardVariants = VariantProps<typeof cardStyle>;

interface CardProps extends ViewProps, CardVariants {}

export function Card({
  intent: _intent,
  padding,
  inverse,
  outline,
  overflow,
  className,
  ...props
}: CardProps) {
  const intent = _intent ?? use(ThemeIntentContext);
  return (
    <View
      {...props}
      className={cardStyle({
        intent,
        padding,
        inverse,
        outline,
        overflow,
        className,
      })}
    />
  );
}
