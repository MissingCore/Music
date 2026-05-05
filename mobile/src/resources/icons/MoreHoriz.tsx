import Svg, { Path } from "react-native-svg";

import { useColor } from "~/modules/theme/useTheme";
import type { Icon } from "./type";

export function MoreHoriz({ size = 24, color }: Icon) {
  const usedColor = useColor(color, "onSurface");
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M239.54-421.62q-24.25 0-41.32-17.06-17.06-17.07-17.06-41.32t17.06-41.32q17.07-17.06 41.32-17.06t41.32 17.06q17.06 17.07 17.06 41.32t-17.06 41.32q-17.07 17.06-41.32 17.06Zm240.46 0q-24.25 0-41.32-17.06-17.06-17.07-17.06-41.32t17.06-41.32q17.07-17.06 41.32-17.06t41.32 17.06q17.06 17.07 17.06 41.32t-17.06 41.32q-17.07 17.06-41.32 17.06Zm240.46 0q-24.25 0-41.32-17.06-17.06-17.07-17.06-41.32t17.06-41.32q17.07-17.06 41.32-17.06t41.32 17.06q17.06 17.07 17.06 41.32t-17.06 41.32q-17.07 17.06-41.32 17.06Z" />
    </Svg>
  );
}
