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
  color?: AppColor;
  easing?: boolean;
  toTransparent?: boolean;
}

export function TransitionGradient({
  color = "background",
  easing = false,
  toTransparent = false,
  ...props
}: TransitionGradientProps) {
  const gradientColor = useColor(color);

  const gradientProps = useMemo(() => {
    const fromColor = withAlpha(gradientColor, toTransparent ? 1 : 0);
    const toColor = withAlpha(gradientColor, toTransparent ? 0 : 1);
    return easing
      ? (easeGradient({
          colorStops: { 0: { color: fromColor }, 1: { color: toColor } },
        }) as unknown as Pick<LinearGradientProps, "colors" | "locations">)
      : {
          colors: [fromColor, toColor] as LinearGradientProps["colors"],
        };
  }, [easing, toTransparent, gradientColor]);

  return <LinearGradient {...props} {...gradientProps} />;
}
