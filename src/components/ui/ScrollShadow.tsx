import { LinearGradient } from "expo-linear-gradient";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";

type ScrollShadowProps = {
  size: number;
  color?: string;
  vertical?: boolean;
};

/** @description Add simple scrollshadows to scrollable content. */
export function ScrollShadow({
  size,
  color = Colors.canvas,
  vertical = false,
}: ScrollShadowProps) {
  const sharedStyles = {
    start: { x: 0.0, y: !vertical ? 1.0 : 0.0 },
    end: { x: !vertical ? 1.0 : 0.0, y: 1.0 },
    style: !vertical ? { width: size } : { height: size },
  };

  return (
    <>
      <LinearGradient
        colors={[`${color}E6`, `${color}00`]}
        {...sharedStyles}
        className={cn("absolute left-0 top-0", {
          "h-full": !vertical,
          "w-full": vertical,
        })}
      />
      <LinearGradient
        colors={[`${color}00`, `${color}E6`]}
        {...sharedStyles}
        className={cn("absolute", {
          "right-0 top-0 h-full": !vertical,
          "bottom-0 left-0 w-full": vertical,
        })}
      />
    </>
  );
}
