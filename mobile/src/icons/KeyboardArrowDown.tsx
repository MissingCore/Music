import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function KeyboardArrowDown({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="m480-361.89-221.31-221.3 39.73-38.92L480-440.54l181.58-181.57 39.73 38.92L480-361.89Z" />
    </Svg>
  );
}
