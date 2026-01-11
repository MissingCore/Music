import Svg, { Path } from "react-native-svg";

import { useColor } from "~/hooks/useTheme";
import type { Icon } from "./type";

// From ionicons.
export function Shuffle({ size = 24, color }: Icon) {
  const usedColor = useColor(color, "onSurface");
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Path
        fill="none"
        stroke={usedColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
        d="M400 304l48 48-48 48M400 112l48 48-48 48M64 352h85.19a80 80 0 0066.56-35.62L256 256"
      />
      <Path
        fill="none"
        stroke={usedColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
        d="M64 160h85.19a80 80 0 0166.56 35.62l80.5 120.76A80 80 0 00362.81 352H416M416 160h-53.19a80 80 0 00-66.56 35.62L288 208"
      />
    </Svg>
  );
}
