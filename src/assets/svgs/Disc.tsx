import Svg, { Circle } from "react-native-svg";

/** @description Thinner Feather icon "disc". */
export function Disc({ size, color }: { size: number; color: string }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="0.25"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Circle cx="12" cy="12" r="10" />
      <Circle cx="12" cy="12" r="3" />
    </Svg>
  );
}
