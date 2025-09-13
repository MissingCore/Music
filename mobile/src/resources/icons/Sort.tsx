import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function Sort({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M176.15-268.08q-11.63 0-19.85-8.22-8.22-8.23-8.22-19.87 0-11.45 8.22-19.66t19.85-8.21h152.08q11.64 0 19.86 8.23 8.22 8.22 8.22 19.67 0 11.64-8.22 19.85t-19.86 8.21H176.15Zm0-180q-11.63 0-19.85-8.13t-8.22-19.77q0-11.64 8.22-19.85t19.85-8.21h380.04q11.44 0 19.67 8.23 8.22 8.22 8.22 19.86 0 11.64-8.22 19.76-8.23 8.11-19.67 8.11H176.15Zm0-179.8q-11.63 0-19.85-8.23-8.22-8.22-8.22-19.86 0-11.45 8.22-19.66t19.85-8.21h607.89q11.44 0 19.66 8.22t8.22 19.67q0 11.64-8.22 19.85-8.22 8.22-19.66 8.22H176.15Z" />
    </Svg>
  );
}
