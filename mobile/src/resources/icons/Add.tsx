import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function Add({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M454.04-454.54h-200q-11.03 0-18.5-7.41-7.46-7.41-7.46-18.56 0-11.14 7.46-18.55 7.47-7.4 18.5-7.4h200v-200q0-11.03 7.49-18.5 7.49-7.46 18.55-7.46 11.07 0 18.48 7.46 7.4 7.47 7.4 18.5v200h200q11.03 0 18.5 7.49 7.46 7.49 7.46 18.57 0 11.25-7.46 18.55-7.47 7.31-18.5 7.31h-200v200q0 11.2-7.49 18.58-7.49 7.38-18.55 7.38-11.07 0-18.48-7.38-7.4-7.38-7.4-18.58v-200Z" />
    </Svg>
  );
}
