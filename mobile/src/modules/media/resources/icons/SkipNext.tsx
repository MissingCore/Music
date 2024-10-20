import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";

export function SkipNext({
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
      <Path d="M652.15-274.96v-410.08h55.96v410.08h-55.96Zm-400.26 0v-410.08L559.04-480 251.89-274.96Z" />
    </Svg>
  );
}
