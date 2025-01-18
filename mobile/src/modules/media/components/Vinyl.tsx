import { View } from "react-native";
import type { CircleProps } from "react-native-svg";
import Svg, { Circle, Defs, Mask, Rect } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";

import { Colors } from "@/constants/Styles";
import { MediaImage } from "./MediaImage";

const CENTER = { cx: 384, cy: 384 };
const GROOVES = {
  ...CENTER,
  fill: "none",
  stroke: "#FFF",
  strokeWidth: 3,
  opacity: 0.075,
} satisfies CircleProps;

/**
 * Plain vinyl component. Need this convoluted way as the SVG `<Image />`
 * component is slow (ie: the image doesn't load immediately on first look).
 */
export function Vinyl(props: {
  size: number;
  source: MediaImage.ImageSource | MediaImage.ImageSource[];
}) {
  const { canvas } = useTheme();
  return (
    <View className="relative">
      <MediaImage
        type="playlist"
        source={props.source}
        size={props.size / 2}
        className="absolute translate-x-1/2 translate-y-1/2 rounded-full bg-red"
        noPlaceholder
      />
      <Svg width={props.size} height={props.size} viewBox="0 0 768 768">
        <Defs>
          <Mask id="hole">
            <Circle {...CENTER} r={384} fill="white" />
            <Circle {...CENTER} r={192} fill="black" />
          </Mask>
        </Defs>
        {/* Background */}
        <Circle {...CENTER} r={384} fill={Colors.neutral10} mask="url(#hole)" />
        {/* Grooves */}
        <Circle {...GROOVES} r={264} />
        <Circle {...GROOVES} r={304} />
        <Circle {...GROOVES} r={344} />
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
    </View>
  );
}
