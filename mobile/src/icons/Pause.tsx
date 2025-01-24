import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function Pause({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M559.69-226.46v-507.08h145.96v507.08H559.69Zm-305.15 0v-507.08H400.5v507.08H254.54Z" />
    </Svg>
  );
}
