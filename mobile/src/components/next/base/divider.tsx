// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { VariantProps } from "cva/config";
import { View } from "react-native";

import { cva } from "~/lib/style";
import type { IntentVariant } from "./theming";

const dividerStyle = cva({
  base: "h-px bg-outlineVariant",
  variants: {
    intent: {
      unset: null,
      muted: null,
      primary: "bg-primaryDim",
      secondary: "bg-secondaryDim",
      error: "bg-errorDim",
    } satisfies IntentVariant,
  },
  defaultVariants: {
    intent: "unset",
  },
});

interface DividerProps extends VariantProps<typeof dividerStyle> {
  className?: string;
}

export function Divider({ intent, className }: DividerProps) {
  return <View className={dividerStyle({ intent, className })} />;
}
