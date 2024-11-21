import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import type { Icon } from "./type";

export function VolumeDown({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M226.46-384.85v-190.3h144.43l165.07-165.08v520.46L370.89-384.85H226.46Zm400.85 47.77v-287.03q41.07 21.8 63.65 60.4 22.58 38.6 22.58 83.71 0 45.11-22.58 83.11t-63.65 59.81ZM480-604.88l-85.5 85.69H282.42v78.38H394.5l85.5 85.5v-249.57ZM381.31-480Z" />
    </Svg>
  );
}
