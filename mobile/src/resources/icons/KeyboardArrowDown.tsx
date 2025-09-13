import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function KeyboardArrowDown({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M480-375.85q-6.92 0-12.9-2.46t-11.1-7.77L278.65-563.42q-8.3-8.12-8.25-19.58.06-11.46 8.56-19.65 8.5-8.2 19.62-8.2 11.11 0 19.3 8.2L480-440.54l162.12-162.11q7.8-7.81 19.11-8 11.31-.2 19.81 8 8.5 8.19 8.75 19.46.25 11.27-8.25 19.77L504.19-386.08q-5.31 5.31-11.29 7.77-5.98 2.46-12.9 2.46Z" />
    </Svg>
  );
}
