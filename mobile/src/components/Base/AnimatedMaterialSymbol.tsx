// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import Animated from "react-native-reanimated";
import { Path, Svg } from "react-native-svg";

import type { AppColor } from "~/modules/customization/theme/core/constants";
import { useColor } from "~/modules/customization/theme/hooks";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  /** Defaults to `24px`. */
  size?: number;
  /** Defaults to theme's `onSurface` color. */
  color?: AppColor;
  /**
   * Use the alternative version of the icon if available (ie: filled, animated).
   * Defaults to `false`.
   */
  alternative?: boolean;
}

/**
 * Create an Icon where setting the `alternative` prop will animate the
 * SVG via Reanimated's CSS SVG Animations.
 * - **Only support a single `d` path.**
 */
export function createAnimatedMaterialSymbol(
  initDPath: string,
  toDPath: string,
) {
  return function AnimatedMaterialSymbol({
    size = 24,
    color,
    alternative = false,
  }: Props) {
    const usedColor = useColor(color, "onSurface");
    return (
      <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
        <AnimatedPath
          animatedProps={{
            animationDuration: "150ms",
            animationFillMode: "forwards",
            animationName: {
              from: { d: alternative ? initDPath : toDPath },
              to: { d: alternative ? toDPath : initDPath },
            },
            animationTimingFunction: "linear",
          }}
        />
      </Svg>
    );
  };
}
