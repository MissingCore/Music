// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ViewProps } from "react-native";
import type { AnimatedProps } from "react-native-reanimated";
import Animated, { LinearTransition } from "react-native-reanimated";

import { cn } from "~/_next/utils/style";
import { useBlurStyle } from "./primitives/blur";

export function BlurContainer({
  className,
  style,
  ...props
}: AnimatedProps<ViewProps>) {
  const blurStyle = useBlurStyle();
  return (
    <Animated.View
      {...props}
      layout={LinearTransition}
      style={[blurStyle, style]}
      className={cn("flex-row items-center rounded-full", className)}
    />
  );
}
