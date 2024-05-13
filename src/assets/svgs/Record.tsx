import { cssInterop } from "nativewind";
import Svg, { Circle, Line } from "react-native-svg";

import { Colors } from "@/constants/Styles";

const WrappedSvg = cssInterop(Svg, { className: "style" });

/** @description Similar to the one shown in the Nothing Recorder app. */
export function Record({
  size,
  color = Colors.foreground50,
  className,
}: {
  size: number;
  color?: string;
  className?: string;
}) {
  return (
    <WrappedSvg
      width={size}
      height={size}
      viewBox="0 0 836 836"
      fill="none"
      className={className}
    >
      <Circle cx="418" cy="418" r="343.5" strokeWidth="8" stroke={color} />
      <Circle cx="418" cy="418" r="88" strokeWidth="6" stroke={color} />
      <Circle cx="418" cy="418" r="22" fill={color} />
      <Line
        x1="570"
        y1="416.5"
        x2="701"
        y2="416.5"
        strokeWidth="4"
        stroke={color}
      />
      <Line
        x1="135"
        y1="416.5"
        x2="266"
        y2="416.5"
        strokeWidth="4"
        stroke={color}
      />
    </WrappedSvg>
  );
}
