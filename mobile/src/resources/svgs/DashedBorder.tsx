import { cssInterop } from "nativewind";
import Svg, { Path } from "react-native-svg";

import { Colors } from "@/constants/Styles";

const WrappedSvg = cssInterop(Svg, { className: "style" });

/** Custom dashed border with longer dashes & spacing. Has a 16px radius. */
export function DashedBorder({
  size,
  color = Colors.foreground50,
}: {
  size: number;
  color?: string;
}) {
  return (
    <WrappedSvg
      width={size}
      height={size}
      viewBox="0 0 201 202"
      preserveAspectRatio="none"
      className="absolute left-0 top-0 size-full"
    >
      <Path
        d="M184.5 1H16.5C7.66344 1 0.5 8.16344 0.5 17V185C0.5 193.837 7.66344 201 16.5 201H184.5C193.337 201 200.5 193.837 200.5 185V17C200.5 8.16344 193.337 1 184.5 1Z"
        vectorEffect="non-scaling-stroke"
        fill="none"
        stroke={color}
        strokeDasharray={[10, 10]}
        strokeWidth={1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </WrappedSvg>
  );
}
