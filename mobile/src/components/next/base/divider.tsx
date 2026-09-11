// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { VariantProps } from "cva/config";
import { use } from "react";
import { View } from "react-native";

import { cva } from "~/lib/style";
import type { IntentVariant } from "./context";
import { ThemeIntentContext } from "./context";

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

type DividerVariants = VariantProps<typeof dividerStyle>;

interface DividerProps extends DividerVariants {
  className?: string;
}

/** Simple `1px` tall divider. */
export function Divider({ intent: _intent, className }: DividerProps) {
  const intent = _intent ?? use(ThemeIntentContext);
  return <View className={dividerStyle({ intent, className })} />;
}
