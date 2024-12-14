import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";
import type { Icon } from "./type";

export function Edit({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M205-205h53l392-391.5-53.5-53.5L205-257.5v52.5Zm-75 75v-159l573-572 157.5 159.5L289-130H130Zm625-572.5L702.5-755l52.5 52.5ZM623-623l-26.5-27 53.5 53.5-27-26.5Z" />
    </Svg>
  );
}
