import Svg, { Path, Rect } from "react-native-svg";

import { useColor } from "~/hooks/useTheme";
import type { Icon } from "./type";

// From ionicons.
export function ColorWand({ size = 24, color }: Icon) {
  const usedColor = useColor(color, "onSurface");
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Rect
        fill="none"
        stroke={usedColor}
        strokeMiterlimit="10"
        strokeWidth="32"
        x="280.48"
        y="122.9"
        width="63.03"
        height="378.2"
        rx="31.52"
        transform="rotate(-45 312.002 311.994)"
      />
      <Path d="M178.38 178.38a31.64 31.64 0 000 44.75L223.25 268 268 223.25l-44.87-44.87a31.64 31.64 0 00-44.75 0z" />
      <Path
        stroke={usedColor}
        strokeMiterlimit="10"
        strokeWidth="32"
        strokeLinecap="round"
        d="M48 192h48M90.18 90.18l33.94 33.94M192 48v48M293.82 90.18l-33.94 33.94M124.12 259.88l-33.94 33.94"
      />
    </Svg>
  );
}
