import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";

export function PlaylistAdd({
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
      <Path d="M136.46-333.23v-55.96h280v55.96h-280Zm0-158.39v-55.96h437.58v55.96H136.46Zm0-157.57v-55.96h437.58v55.96H136.46ZM650-175.65v-157.58H492.42v-55.96H650v-158.39h55.96v158.39h158.39v55.96H705.96v157.58H650Z" />
    </Svg>
  );
}
