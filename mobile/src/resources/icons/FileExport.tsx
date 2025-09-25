import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function FileExport({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M480-480ZM214.12-82.15 175.27-122l129.92-130.12H199.46v-55.96h200.73v200.73h-55.96v-104.73L214.12-82.15Zm269.73-25.93v-55.96h220.61q5.39 0 8.85-3.46t3.46-8.85v-445.27H542.42v-174.34H255.54q-5.39 0-8.85 3.46t-3.46 8.85v391.92h-55.96v-391.92q0-28.26 20.01-48.27 20-20 48.26-20h315.27L772.73-650v473.65q0 28.26-20.01 48.27-20 20-48.26 20H483.85Z" />
    </Svg>
  );
}
