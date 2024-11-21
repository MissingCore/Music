import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import type { Icon } from "./type";

export function VolumeUp({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M560.73-169.04V-227q82.69-27.35 133.06-96.98 50.36-69.64 50.36-156.71 0-86.89-50.36-156.52-50.37-69.64-133.06-97.17v-57.96q105.73 30.11 172.56 116.13 66.82 86.02 66.82 195.52 0 109.69-66.82 195.71-66.83 86.02-172.56 115.94ZM159.89-384.85v-190.3h144.42l165.07-165.08v520.46L304.31-384.85H159.89Zm400.84 47.77v-287.03q40.15 21.19 63.19 59.78 23.04 38.6 23.04 84.33 0 45.61-23.23 83.67t-63 59.25Zm-147.31-267.8-85.5 85.69H215.85v78.38h112.07l85.5 85.5v-249.57ZM314.73-480Z" />
    </Svg>
  );
}
