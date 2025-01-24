import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function OpenInNew({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M147.27-147.27v-665.46h314.92v55.96H203.23v553.54h553.54v-258.96h55.96v314.92H147.27Zm242.81-203.38-39.43-39.43 366.89-366.69h-164v-55.96h259.19v259.19h-55.96v-164L390.08-350.65Z" />
    </Svg>
  );
}
