import Svg, { Circle } from "react-native-svg";

import Colors from "@/constants/Colors";

/** @description Thinner Feather "disc" icon. */
export function Disc({
  size,
  color = Colors.foreground50,
}: {
  size: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="0.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx="12" cy="12" r="10" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}
