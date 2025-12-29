import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function DragHandle({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M188.08-376.46v-55.96h583.84v55.96H188.08Zm0-151.93v-55.96h583.84v55.96H188.08Z" />
    </Svg>
  );
}
