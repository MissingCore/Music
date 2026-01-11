import Svg, { Path } from "react-native-svg";

import { useColor } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function Check({ size = 24, color }: Icon) {
  const usedColor = useColor(color, "onSurface");
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="m382.81-338.58 342.31-342.3q8.42-8.43 19.67-8.62 11.25-.19 20.06 8.62 8.8 8.8 8.8 20.01 0 11.22-8.8 19.83L407-282.89q-10.54 10.54-24.19 10.54-13.66 0-24-10.54L195.04-446.65q-8.62-8.43-8.65-19.73-.04-11.31 8.76-20.12 8.81-8.81 20.02-8.81 11.21 0 20.02 8.81l147.62 147.92Z" />
    </Svg>
  );
}
