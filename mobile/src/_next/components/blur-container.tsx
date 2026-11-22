// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ViewProps } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

import { useTheme } from "~/_next/context/theme-context";

import { withAlpha } from "~/_next/utils/color";
import { cn } from "~/_next/utils/style";

export function BlurContainer({ className, style, ...props }: ViewProps) {
  const { background } = useTheme().colors;
  return (
    <Animated.View
      {...props}
      layout={LinearTransition}
      style={[
        {
          backgroundImage: `
            linear-gradient(${withAlpha(background, 0.25)}, ${withAlpha(background, 0.25)}),
            linear-gradient(to bottom right, ${withAlpha("#FFF", 0.25)}, ${withAlpha("#FFF", 0.15)}),
            linear-gradient(to bottom right, ${withAlpha("#000", 0.05)}, ${withAlpha("#000", 0.2)}),
            linear-gradient(${withAlpha("#000", 0.1)}, ${withAlpha("#000", 0.05)})
          `,
          borderColor: withAlpha("#FFF", 0.2),
        },
        style,
      ]}
      className={cn(
        "flex-row items-center overflow-hidden rounded-full border",
        className,
      )}
    />
  );
}
