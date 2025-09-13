import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function Remove({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M254.04-454.54q-11.03 0-18.5-7.41-7.46-7.41-7.46-18.56 0-11.14 7.46-18.55 7.47-7.4 18.5-7.4h451.92q11.03 0 18.5 7.49 7.46 7.49 7.46 18.57 0 11.25-7.46 18.55-7.47 7.31-18.5 7.31H254.04Z" />
    </Svg>
  );
}
