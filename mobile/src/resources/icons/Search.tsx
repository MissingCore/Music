import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function Search({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M382.23-340.23q-100.36 0-169.74-69.43-69.37-69.42-69.37-169.5 0-100.07 69.32-169.53 69.31-69.46 169.49-69.46t169.65 69.47q69.46 69.47 69.46 169.62 0 41.91-14.08 80.75-14.08 38.85-37.58 67.26l228.35 227.81q8 7.97 8.19 19.53.19 11.56-8.4 20.06-8.6 8.5-19.87 8.5-11.27 0-19.64-8.37L529.88-391.89q-29.73 24.77-68.42 38.22-38.69 13.44-79.23 13.44Zm-.15-55.96q76.8 0 129.9-53.02 53.1-53.03 53.1-130 0-76.98-53.1-129.98-53.1-53-130-53t-129.9 53.02q-53 53.02-53 130 0 76.98 53.01 129.98 53.02 53 129.99 53Z" />
    </Svg>
  );
}
