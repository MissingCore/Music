import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import type { Icon } from "./type";

export function Close({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="m258.42-218.69-38.92-39.73L440.27-480 219.5-701.58l38.92-39.73L480-519.73l221.58-221.58 38.92 39.73L519.73-480 740.5-258.42l-38.92 39.73L480-440.27 258.42-218.69Z" />
    </Svg>
  );
}
