// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { VariantProps } from "cva/config";
import type { ViewProps } from "react-native";
import { View } from "react-native";

import { cva } from "~/lib/style";
import { baseContainerStyle } from "./styles";

const cardStyle = cva({
  composes: [baseContainerStyle],
  base: "rounded-xl p-4",
  defaultVariants: { filled: true },
});

interface CardProps
  extends ViewProps, Omit<VariantProps<typeof cardStyle>, "filled"> {}

export function Card({ intent, outline, className, ...props }: CardProps) {
  return (
    <View {...props} className={cardStyle({ intent, outline, className })} />
  );
}
