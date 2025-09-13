import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

// Filled
export function PlayArrow({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M345.66-307.55v-345.09q0-15.13 10.31-24.57t24-9.44q4.34 0 9 1.06 4.67 1.05 9.02 3.58l271.12 173.39q7.73 5.44 11.7 12.82 3.96 7.38 3.96 15.8 0 8.42-3.96 15.8-3.97 7.38-11.7 12.62L397.99-278.19q-4.37 2.73-9.05 3.78-4.67 1.06-8.77 1.06-13.94 0-24.23-9.44-10.28-9.44-10.28-24.76Z" />
    </Svg>
  );
}
