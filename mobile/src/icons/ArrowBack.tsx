import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function ArrowBack({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="m295.73-452.12 224.31 224.31L480-188.08 188.08-480 480-771.92l40.04 39.73-224.31 224.11h476.19v55.96H295.73Z" />
    </Svg>
  );
}
