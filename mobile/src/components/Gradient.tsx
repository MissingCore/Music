import { LinearGradient } from "expo-linear-gradient";
import { useMemo } from "react";

import type { ColorRole } from "~/lib/style";
import { cn } from "~/lib/style";
import { useColor } from "~/modules/theme/hooks";

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
