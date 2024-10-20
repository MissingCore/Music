import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";

export function Shuffle({
  size = 24,
  color,
}: {
  size?: number;
  color?: string;
}) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Path
        fill="none"
        stroke={usedColor}
        strokeLinecap="square"
        strokeMiterlimit="10"
        strokeWidth="32"
        d="M400 304l48 48-48 48M400 112l48 48-48 48M64 352h128l60-92"
      />
      <Path
        fill="none"
        stroke={usedColor}
        strokeLinecap="square"
        strokeMiterlimit="10"
        strokeWidth="32"
        d="M64 160h128l128 192h96M416 160h-96l-32 48"
      />
    </Svg>
  );
}
