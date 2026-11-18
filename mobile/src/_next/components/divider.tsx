// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { useColor } from "~/_next/context/theme-context";

import type { AppColor } from "~/_next/constants/theme";
import { cn } from "~/_next/utils/style";

interface DividerProps {
  color?: AppColor;
  className?: string;
}

export function Divider({ color = "border", className }: DividerProps) {
  const backgroundColor = useColor(color);
  return (
    <View
      style={{ backgroundColor }}
      className={cn("h-px w-full rounded-full", className)}
    />
  );
}
