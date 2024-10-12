import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";

export function SkipPrevious({
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
      <Path d="M251.89-274.96v-410.08h55.96v410.08h-55.96Zm456.22 0L400.96-480l307.15-205.04v410.08Z" />
    </Svg>
  );
}
