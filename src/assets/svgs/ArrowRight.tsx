import Svg, { Path } from "react-native-svg";

import Colors from "@/constants/Colors";

/** @description Thinner & sharp heroicons "arrow-right" icon. */
export function ArrowRight({
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
      strokeWidth="1"
    >
      <Path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </Svg>
  );
}
