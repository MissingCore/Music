// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";

import { cn } from "~/lib/style";
import type { ColorRole } from "~/modules/customization/theme/core/constants";
import { useColor } from "~/modules/customization/theme/hooks";

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
