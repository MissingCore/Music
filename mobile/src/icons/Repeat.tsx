import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

// From ionicons.
export function Repeat({ size = 24, color }: Icon) {
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
        d="M320 120l48 48-48 48"
      />
      <Path
        fill="none"
        stroke={usedColor}
        strokeLinecap="square"
        strokeMiterlimit="10"
        strokeWidth="32"
        d="M352 168H64v96M192 392l-48-48 48-48"
      />
      <Path
        fill="none"
        stroke={usedColor}
        strokeLinecap="square"
        strokeMiterlimit="10"
        strokeWidth="32"
        d="M160 344h288v-96"
      />
    </Svg>
  );
}
