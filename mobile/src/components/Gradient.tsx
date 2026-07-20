// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";
import type { ViewProps } from "react-native";
import type { AnimatedProps } from "react-native-reanimated";
import Animated from "react-native-reanimated";

import { cn } from "~/lib/style";
import type { ColorRole } from "~/modules/customization/theme/core/constants";
import { useColor } from "~/modules/customization/theme/hooks";

//#region Top Down Gradient
/** Gradient where the darkest portion is on the top. */
export function TopDownGradient(props: {
  height: number;
  color?: ColorRole;
  /** Position in gradient we want the fade to start from. */
  startFrom?: number;
  className?: string;
}) {
  const color = useColor(props.color, "surface");

  const locations = useMemo(() => {
    if (!props.startFrom) return undefined;
    return [props.startFrom / props.height, 1] as const;
  }, [props.height, props.startFrom]);

  return (
    <LinearGradient
      colors={[`${color}FF`, `${color}00`]}
      locations={locations}
      pointerEvents="none"
      style={{ height: props.height }}
      className={cn("w-full", props.className)}
    />
  );
}
//#endregion

//#region Horizontal Scroll Gradient
/** Gradient to smooth out edge transition in horizontal lists. */
export function HorizontalScrollGradient({
  children,
  size = 16,
  gutter = 0,
  color,
  ...props
}: {
  children: React.ReactNode;
  size?: number;
  gutter?: number;
  color?: ColorRole;
} & AnimatedProps<ViewProps>) {
  const gradientColor = useColor(color, "surface");
  return (
    <Animated.View
      {...props}
      style={[props.style, { marginHorizontal: -gutter }]}
      className={cn("relative", props.className)}
    >
      {children}
      {/* Scroll Shadow */}
      <LinearGradient
        pointerEvents="none"
        colors={[`${gradientColor}E6`, `${gradientColor}00`]}
        {...ShadowProps}
        style={{ width: size }}
        className="absolute h-full ltr:left-0 rtl:right-0"
      />
      <LinearGradient
        pointerEvents="none"
        colors={[`${gradientColor}00`, `${gradientColor}E6`]}
        {...ShadowProps}
        style={{ width: size }}
        className="absolute h-full ltr:right-0 rtl:left-0"
      />
    </Animated.View>
  );
}

const ShadowProps = { start: { x: 0.0, y: 1.0 }, end: { x: 1.0, y: 1.0 } };
//#endregion
