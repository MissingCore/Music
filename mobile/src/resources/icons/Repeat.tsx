import Svg, { Path } from "react-native-svg";

import { useColor } from "~/hooks/useTheme";
import type { Icon } from "./type";

// From ionicons.
export function Repeat({ size = 24, color }: Icon) {
  const usedColor = useColor({ color, fallback: "onSurface" });
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Path
        fill="none"
        stroke={usedColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
        d="M320 120l48 48-48 48"
      />
      <Path
        fill="none"
        stroke={usedColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
        d="M352 168H144a80.24 80.24 0 00-80 80v16M192 392l-48-48 48-48"
      />
      <Path
        fill="none"
        stroke={usedColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
        d="M160 344h208a80.24 80.24 0 0080-80v-16"
      />
    </Svg>
  );
}
