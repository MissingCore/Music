import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import type { Icon } from "./type";

export function Sort({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M148.08-268.08v-55.96h208.23v55.96H148.08Zm0-180v-55.96h436v55.96h-436Zm0-179.8v-55.96h663.84v55.96H148.08Z" />
    </Svg>
  );
}
