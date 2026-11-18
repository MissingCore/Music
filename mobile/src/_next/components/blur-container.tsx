// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ViewProps } from "react-native";
import { View } from "react-native";

import { useColor } from "~/_next/context/theme-context";

import type { AppColor } from "~/_next/constants/theme";
import { withAlpha } from "~/_next/utils/color";
import { cn } from "~/_next/utils/style";

interface BlurContainerProps extends ViewProps {
  color?: AppColor;
}

export function BlurContainer({
  color: _color = "surface",
  className,
  style,
  ...props
}: BlurContainerProps) {
  const color = useColor(_color);
  return (
    <View
      {...props}
      style={[
        {
          backgroundColor: withAlpha(color, 0.15),
          borderColor: withAlpha(color, 0.15),
        },
        style,
      ]}
      className={cn("rounded-full border", className)}
    />
  );
}
