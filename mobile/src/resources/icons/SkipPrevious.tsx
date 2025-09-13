import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

// Filled
export function SkipPrevious({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M251.89-303.04v-354.2q0-11.35 8.22-19.58 8.23-8.22 19.77-8.22t19.76 8.24q8.21 8.23 8.21 19.65v354.11q0 11.63-8.24 19.86-8.24 8.22-19.66 8.22-11.64 0-19.85-8.22-8.21-8.23-8.21-19.86Zm403.22-7.15L443.59-451.67q-7.78-5.14-11.55-12.56-3.77-7.42-3.77-15.81 0-8.38 3.77-15.77 3.77-7.38 11.55-12.53L655.11-650q4.43-3.11 9.2-4.36 4.77-1.25 9.77-1.25 13.46 0 23.75 9.63 10.28 9.64 10.28 24.99v281.87q0 15.45-10.28 24.99-10.29 9.55-23.75 9.55-5 0-9.77-1.15-4.77-1.16-9.2-4.46Z" />
    </Svg>
  );
}
