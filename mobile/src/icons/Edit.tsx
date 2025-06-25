import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function Edit({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M204.04-204.04h47.23L661.54-614 614-661.54 204.04-250.96v46.92Zm-55.96 55.96v-126.5l560.31-560.65 126.72 127.38-560.53 559.77h-126.5Zm607.88-560.57-47.31-47.31 47.31 47.31Zm-118.48 71.17L614-661.54 661.54-614l-24.06-23.48Z" />
    </Svg>
  );
}
