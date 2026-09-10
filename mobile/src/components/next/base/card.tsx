// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { VariantProps } from "cva/config";
import type { ViewProps } from "react-native";
import { View } from "react-native";

import { cva } from "~/lib/style";

export const cardStyle = cva({
  base: "rounded-3xl bg-surfaceContainerLowest",
  variants: {
    intent: {
      unset: null,
      primary: "bg-primary",
      secondary: "bg-secondary",
      error: "bg-error",
    },
    padding: { true: "p-4" },
    outline: { true: "border" },
  },
  compoundVariants: [
    { intent: "unset", outline: true, className: "border-outlineVariant" },
    { intent: "primary", outline: true, className: "border-primaryDim" },
    { intent: "secondary", outline: true, className: "border-secondaryDim" },
    { intent: "error", outline: true, className: "border-errorDim" },
  ],
  defaultVariants: {
    intent: "unset",
    padding: true,
    outline: false,
  },
});

interface CardProps extends ViewProps, VariantProps<typeof cardStyle> {}

export function Card({
  intent,
  padding,
  outline,
  className,
  ...props
}: CardProps) {
  return (
    <View
      {...props}
      className={cardStyle({ intent, padding, outline, className })}
    />
  );
}
