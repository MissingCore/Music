import { LinearGradient } from "expo-linear-gradient";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";

/** @description Add simple scrollshadows to scrollable content. */
export function ScrollShadow(props: {
  size: number;
  color?: string;
  vertical?: boolean;
}) {
  const color = props.color || Colors.canvas;
  const sharedStyles = {
    start: { x: 0.0, y: !props.vertical ? 1.0 : 0.0 },
    end: { x: !props.vertical ? 1.0 : 0.0, y: 1.0 },
    style: !props.vertical ? { width: props.size } : { height: props.size },
  };

  return (
    <>
      <LinearGradient
        colors={[`${color}E6`, `${color}00`]}
        {...sharedStyles}
        className={cn("absolute left-0 top-0", {
          "h-full": !props.vertical,
          "w-full": props.vertical,
        })}
      />
      <LinearGradient
        colors={[`${color}00`, `${color}E6`]}
        {...sharedStyles}
        className={cn("absolute", {
          "right-0 top-0 h-full": !props.vertical,
          "bottom-0 left-0 w-full": props.vertical,
        })}
      />
    </>
  );
}
