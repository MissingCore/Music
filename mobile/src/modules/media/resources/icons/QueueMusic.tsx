import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";

export function QueueMusic({
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
      <Path d="M633.76-188.08q-43.1 0-73.18-30.13-30.08-30.14-30.08-73.18 0-43.37 30.14-73.68 30.15-30.31 73.21-30.31 13.16 0 25.31 3.77 12.15 3.76 22.75 11.07v-311.38h170.01v66.26H737.81v334.36q0 42.97-30.35 73.09-30.35 30.13-73.7 30.13ZM148.08-356.73v-55.96h297.54v55.96H148.08Zm0-139.62v-55.96h450.11v55.96H148.08Zm0-139.61v-55.96h450.11v55.96H148.08Z" />
    </Svg>
  );
}
