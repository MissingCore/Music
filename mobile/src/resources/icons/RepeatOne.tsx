import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
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
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
        d="M320 120L368 168L320 216"
      />
      <Path
        fill="none"
        stroke={usedColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
        d="M352 168H144C122.802 168.063 102.491 176.512 87.5014 191.501C72.5122 206.491 64.0633 226.802 64 248V264M192 392L144 344L192 296"
      />
      <Path
        fill="none"
        stroke={usedColor}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="32"
        d="M160 344H376"
      />
      <Path
        fill={usedColor}
        stroke={usedColor}
        d="M463.5 343.479L463.348 345.732L462.906 347.863L462.199 349.859L461.25 351.706L460.082 353.391L458.719 354.9L457.184 356.219L455.5 357.335L453.691 358.235L451.781 358.905L449.793 359.331L447.75 359.399H445.676L443.594 359.013L441.527 358.33L439.5 357.335L437.735 356.154L436.162 354.768L434.793 353.202L433.644 351.479L432.726 349.622L432.5 348V345.5V343.5V257.882L408.99 275.88L407.086 277.095L405.108 278.005L403.082 278.621L401.031 278.954L398.981 279.014L396.957 278.812L394.984 278.36L393.086 277.667L391.287 276.746L389.614 275.606L388.09 274.258L386.741 272.714L385.591 270.984L384.666 269.079L383.989 267.01L383.586 264.787L383.489 262.665L383.67 260.576L384.118 258.544L384.823 256.596L385.773 254.754L386.958 253.045L388.367 251.492L389.99 250.12L433.41 218.12L435.572 216.778L437.905 215.8L440.363 215.203L442.9 215H447.5L450.725 215.325L453.728 216.257L456.446 217.733L458.814 219.686L460.767 222.054L462.243 224.772L463.175 227.775L463.5 231V343.479Z"
      />
    </Svg>
  );
}
