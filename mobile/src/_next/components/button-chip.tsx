// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useColor } from "~/_next/context/theme-context";

import { withAlpha } from "~/_next/utils/color";
import { cn } from "~/_next/utils/style";
import type { RippleProps } from "./ripple";
import { Ripple } from "./ripple";
import { Text } from "./typography";

interface ChipButtonProps extends RippleProps {
  label: string;
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
      style={[{ borderColor: withAlpha(chipColor, 0.5) }, style]}
      className={cn(
        "min-h-8 items-center justify-center rounded-full border px-2 py-1",
        className,
      )}
    >
      <Text bold color={color} size="sm">
        {label}
      </Text>
    </Ripple>
  );
}
