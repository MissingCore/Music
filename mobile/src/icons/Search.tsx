import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import type { Icon } from "./type";

export function Search({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="m777.65-143.89-247.89-248q-29.61 24.77-68.3 38.22-38.69 13.44-79.23 13.44-100.45 0-169.78-69.36t-69.33-169.5q0-100.14 69.25-169.6 69.26-69.46 169.5-69.46t169.71 69.42q69.46 69.43 69.46 169.67 0 41.91-14.08 80.75-14.08 38.85-37.58 67.28l248 247.41-39.73 39.73Zm-395.57-252.3q76.8 0 129.9-53.02 53.1-53.03 53.1-130 0-76.98-53.1-129.98-53.1-53-130-53t-129.9 53.02q-53 53.02-53 130 0 76.98 53.01 129.98 53.02 53 129.99 53Z" />
    </Svg>
  );
}
