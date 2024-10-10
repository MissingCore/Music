import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";

export function Remove({
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
      <Path d="M228.08-454.54v-51.92h503.84v51.92H228.08Z" />
    </Svg>
  );
}
