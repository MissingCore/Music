import { cssInterop } from "nativewind";
import Svg, { Path } from "react-native-svg";

import Colors from "@/constants/Colors";

const WrappedSvg = cssInterop(Svg, { className: "style" });

/** @description Thinner & sharp heroicons "arrow-right" icon. */
export function ArrowRight({
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
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.25"
      className={className}
    >
      <Path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
    </WrappedSvg>
  );
}
