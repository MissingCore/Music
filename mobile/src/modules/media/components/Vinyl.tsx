import type { CircleProps } from "react-native-svg";
import Svg, { Circle, Rect } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";

import { Colors } from "@/constants/Styles";

const CENTER = { cx: 384, cy: 384 };
const GROOVES = {
  ...CENTER,
  fill: "none",
  stroke: "#FFF",
  strokeWidth: 3,
  opacity: 0.075,
} satisfies CircleProps;

/** Plain vinyl component. */
export function Vinyl(props: {
  size: number;
  source: string | null | Array<string | null>;
}) {
  const { canvas } = useTheme();
  return (
    <Svg width={props.size} height={props.size} viewBox="0 0 768 768">
      {/* Background */}
      <Circle {...CENTER} r={384} fill={Colors.neutral10} />
      {/* Grooves */}
      <Circle {...GROOVES} r={264} />
      <Circle {...GROOVES} r={304} />
      <Circle {...GROOVES} r={344} />
      {/* Artwork */}
      <Circle {...CENTER} r={192} fill={Colors.red} />
      {/* Spin Indicator */}
      <Rect x={384} y={193} width={2} height={24} fill="#FFF" />
      {/* Center hole */}
      <Circle
        {...CENTER}
        r={12}
        fill={canvas}
        stroke={Colors.neutral80}
        strokeWidth={6}
      />
    </Svg>
  );
}
