import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function MoreVert({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M480-181.16q-24.25 0-41.32-17.06-17.06-17.07-17.06-41.32t17.06-41.32q17.07-17.06 41.32-17.06t41.32 17.06q17.06 17.07 17.06 41.32t-17.06 41.32q-17.07 17.06-41.32 17.06Zm0-240.46q-24.25 0-41.32-17.06-17.06-17.07-17.06-41.32t17.06-41.32q17.07-17.06 41.32-17.06t41.32 17.06q17.06 17.07 17.06 41.32t-17.06 41.32q-17.07 17.06-41.32 17.06Zm0-240.46q-24.25 0-41.32-17.06-17.06-17.07-17.06-41.32t17.06-41.32q17.07-17.06 41.32-17.06t41.32 17.06q17.06 17.07 17.06 41.32t-17.06 41.32q-17.07 17.06-41.32 17.06Z" />
    </Svg>
  );
}
