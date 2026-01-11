import Svg, { Path } from "react-native-svg";

import { useColor } from "~/hooks/useTheme";
import type { Icon } from "./type";

// Filled
export function Pause({ size = 24, color }: Icon) {
  const usedColor = useColor(color, "onSurface");
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M615.65-226.46q-23.05 0-39.5-16.55-16.46-16.54-16.46-39.41v-395.16q0-22.87 16.46-39.41 16.45-16.55 39.5-16.55h34.04q22.88 0 39.42 16.55 16.54 16.54 16.54 39.41v395.16q0 22.87-16.54 39.41-16.54 16.55-39.42 16.55h-34.04Zm-305.15 0q-23.05 0-39.51-16.55-16.45-16.54-16.45-39.41v-395.16q0-22.87 16.45-39.41 16.46-16.55 39.51-16.55h34.04q22.87 0 39.42 16.55 16.54 16.54 16.54 39.41v395.16q0 22.87-16.54 39.41-16.55 16.55-39.42 16.55H310.5Z" />
    </Svg>
  );
}
