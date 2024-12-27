import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import type { Icon } from "./type";

// Custom icon based on ionicons' "Repeat" and "Calendar Number".
export function RepeatOne({ size = 24, color }: Icon) {
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
        d="M320 120L368 168L320 216"
      />
      <Path
        fill="none"
        stroke={usedColor}
        strokeLinecap="square"
        strokeMiterlimit="10"
        strokeWidth="32"
        d="M352 168H64V264M192 392L144 344L192 296"
      />
      <Path
        fill="none"
        stroke={usedColor}
        strokeLinecap="square"
        strokeMiterlimit="10"
        strokeWidth="32"
        d="M160 344H352H376"
      />
      <Path
        fill={usedColor}
        stroke={usedColor}
        d="M438.334 215.13H463.5V359.5H432.5V258.919V257.929L431.703 258.516L396.715 284.301L378.299 259.336L438.334 215.13Z"
      />
    </Svg>
  );
}
