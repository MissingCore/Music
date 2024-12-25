import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import type { Icon } from "./type";

export function Add({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M454.04-454.54H228.08v-51.92h225.96v-225.96h51.92v225.96h225.96v51.92H505.96v225.96h-51.92v-225.96Z" />
    </Svg>
  );
}
