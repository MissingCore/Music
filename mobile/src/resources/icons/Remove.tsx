import Svg, { Path } from "react-native-svg";

import { useColor } from "~/modules/theme/hooks";
import type { Icon } from "./type";

export function Remove({ size = 24, color }: Icon) {
  const usedColor = useColor(color, "onSurface");
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M228.08-454.54v-51.92h503.84v51.92H228.08Z" />
    </Svg>
  );
}
