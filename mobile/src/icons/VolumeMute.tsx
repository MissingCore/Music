import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import type { Icon } from "./type";

export function VolumeMute({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M305.66-384.85v-190.3h144.42l165.07-165.08v520.46L450.08-384.85H305.66Z" />
    </Svg>
  );
}
