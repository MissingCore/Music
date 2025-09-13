import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

// Filled
export function SkipNext({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M652.15-303.04v-354.2q0-11.35 8.23-19.58 8.22-8.22 19.77-8.22 11.54 0 19.75 8.24 8.21 8.23 8.21 19.65v354.11q0 11.63-8.24 19.86-8.23 8.22-19.65 8.22-11.64 0-19.86-8.22-8.21-8.23-8.21-19.86Zm-400.26-36.08v-281.87q0-15.35 10.27-24.99 10.26-9.63 23.96-9.63 4.8 0 9.57 1.25 4.77 1.25 9.2 4.36l211.52 141.66q7.78 5.15 11.55 12.57 3.77 7.42 3.77 15.81 0 8.38-3.77 15.77-3.77 7.38-11.55 12.52L304.89-310.19q-4.43 3.3-9.2 4.46-4.77 1.15-9.57 1.15-13.7 0-23.96-9.55-10.27-9.54-10.27-24.99Z" />
    </Svg>
  );
}
