// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { LinearGradientProps } from "expo-linear-gradient";
import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import type { ViewProps } from "react-native";
import { easeGradient } from "react-native-easing-gradient";

import { useColor } from "~/_next/context/theme-context";

import type { AppColor } from "~/_next/constants/theme";
import { withAlpha } from "~/_next/utils/color";

interface TransitionGradientProps extends ViewProps {
  toTransparent?: boolean;
  color?: AppColor;
}

export function TransitionGradient({
  toTransparent = false,
  color = "background",
  ...props
}: TransitionGradientProps) {
  const gradientColor = useColor(color);

  const gradientProps = useMemo(
    () =>
      easeGradient({
        colorStops: {
          0: { color: withAlpha(gradientColor, toTransparent ? 1 : 0) },
          1: { color: withAlpha(gradientColor, toTransparent ? 0 : 1) },
        },
      }) as unknown as Pick<LinearGradientProps, "colors" | "locations">,
    [toTransparent, gradientColor],
  );

  return <LinearGradient {...props} {...gradientProps} />;
}
