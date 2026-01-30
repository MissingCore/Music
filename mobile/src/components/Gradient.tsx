import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";

import { useColor } from "~/hooks/useTheme";

import type { ColorRole } from "~/lib/style";
import { cn } from "~/lib/style";

/** Gradient where the "solid" portion is on the top. */
export function TopDownGradient(props: {
  height: number;
  color?: ColorRole;
  /** Position in gradient we want the fade to start from. */
  startFrom?: number;
  className?: string;
}) {
  const color = useColor(props.color, "surface");

  const gradient = useMemo(
    () => [`${color}FF`, `${color}00`] as const,
    [color],
  );

  const locations = useMemo(() => {
    if (!props.startFrom) return undefined;
    return [props.startFrom / props.height, 1] as const;
  }, [props.height, props.startFrom]);

  return (
    <LinearGradient
      colors={gradient}
      locations={locations}
      pointerEvents="none"
      style={{ height: props.height }}
      className={cn("w-full", props.className)}
    />
  );
}
