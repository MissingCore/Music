// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ViewStyle } from "react-native";

import { useColor } from "~/_next/context/theme-context";

import { cn } from "~/_next/utils/style";
import type { RippleProps } from "./ripple";
import { Ripple } from "./ripple";
import { Text } from "./typography";

interface ChipButtonProps extends Omit<RippleProps, "style"> {
  label: string;
  style?: ViewStyle;
}

export function ChipButton({
  label,
  color = "text",
  className,
  style,
  ...props
}: ChipButtonProps) {
  const chipColor = useColor(color);
  return (
    <Ripple
      {...props}
      color={color}
      style={[{ borderColor: chipColor }, style]}
      className={cn("rounded-full border px-2 py-1", className)}
    >
      <Text color={color}>{label}</Text>
    </Ripple>
  );
}
