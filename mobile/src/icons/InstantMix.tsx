import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function InstantMix({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M211.77-176.15v-279.08h-79.19v-55.96h214.03v55.96h-78.88v279.08h-55.96Zm0-426.39v-182.61h55.96v182.61h-55.96Zm161.46 0v-55.96h78.89v-126.65h55.96v126.65h79.19v55.96H373.23Zm78.89 426.39v-335.04h55.96v335.04h-55.96Zm240.65 0v-121h-78.88v-55.96h214.03v55.96h-79.19v121h-55.96Zm0-268.31v-340.69h55.96v340.69h-55.96Z" />
    </Svg>
  );
}
