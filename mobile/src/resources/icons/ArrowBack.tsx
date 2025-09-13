import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function ArrowBack({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="m295.73-452.12 204.35 204.35q8.42 8.62 8.46 19.87.04 11.25-8.58 19.86-8.81 8.69-19.96 8.75-11.15.06-19.77-8.75L212.27-456q-5.31-5.12-7.77-11.1-2.46-5.98-2.46-12.9t2.46-12.9q2.46-5.98 7.77-11.29l247.96-247.96q8.12-8.12 19.52-8.31 11.4-.19 20.21 8.31 8.62 8.8 8.62 20.02 0 11.21-8.62 20.01L295.73-508.08h448.31q11.46 0 19.67 8.22 8.21 8.21 8.21 19.86 0 11.65-8.21 19.77-8.21 8.11-19.67 8.11H295.73Z" />
    </Svg>
  );
}
