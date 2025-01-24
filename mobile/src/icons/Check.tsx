import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function Check({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M382.81-258.69 175.08-466.42l40.04-40.04 167.69 167.88 362.27-362.27 39.84 40.04-402.11 402.12Z" />
    </Svg>
  );
}
