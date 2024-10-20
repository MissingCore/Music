import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";

export function PlayArrow({
  size = 24,
  color,
}: {
  size?: number;
  color?: string;
}) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M345.66-245.04v-469.92L714.19-480 345.66-245.04Z" />
    </Svg>
  );
}
