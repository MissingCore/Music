// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ViewProps } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

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
    <Animated.View
      {...props}
      layout={LinearTransition}
      style={[
        {
          backgroundColor: withAlpha(color, 0.15),
          borderColor: withAlpha(color, 0.15),
          //! FIXME: Elevation makes text colored by `color` more readable.
          //! However, there might be the possibility of some weird geometric
          //! rendering inside the view due using `elevation` with a transparent
          //! background, so we might remove this.
          elevation: 25,
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
