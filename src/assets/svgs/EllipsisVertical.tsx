import Svg, { Circle } from "react-native-svg";

import Colors from "@/constants/Colors";

/** @description Thinner ionicons "ellipsis-vertical" icon. */
export function EllipsisVertical({
  size,
  color = Colors.foreground50,
}: {
  size: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
      <Circle cx="256" cy="76" r="36" />
      <Circle cx="256" cy="256" r="36" />
      <Circle cx="256" cy="436" r="36" />
    </Svg>
  );
}
