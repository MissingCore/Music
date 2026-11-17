// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ViewProps } from "react-native";
import { View } from "react-native";

import { useColor } from "~/_next/context/theme-context";

import { cn } from "~/_next/utils/style";

export function BlurContainer({ className, style, ...props }: ViewProps) {
  const color = useColor("surface");
  return (
    <View
      {...props}
      style={[{ backgroundColor: color, borderColor: color }, style]}
      className={cn("border", className)}
    />
  );
}
