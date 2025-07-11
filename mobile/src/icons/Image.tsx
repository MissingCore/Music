import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function Image({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M215.45-147.27q-28.35 0-48.26-19.92-19.92-19.91-19.92-48.26v-529.1q0-28.35 19.92-48.26 19.91-19.92 48.26-19.92h529.1q28.35 0 48.26 19.92 19.92 19.91 19.92 48.26v529.1q0 28.35-19.92 48.26-19.91 19.92-48.26 19.92h-529.1Zm.09-55.96h528.92q4.62 0 8.46-3.85 3.85-3.84 3.85-8.46v-528.92q0-4.62-3.85-8.46-3.84-3.85-8.46-3.85H215.54q-4.62 0-8.46 3.85-3.85 3.84-3.85 8.46v528.92q0 4.62 3.85 8.46 3.84 3.85 8.46 3.85Zm-12.31 0v-553.54 553.54Zm107.46-89.19h342.44q10.6 0 15.43-9.29 4.82-9.29-1.56-18.07l-93.4-124.45q-5.29-6.77-13.71-6.77-8.42 0-13.62 6.73l-97.04 125.85-64.72-82.04q-5.28-6.38-13.5-6.38-8.23 0-13.43 6.73l-60.02 80.31q-7.06 8.8-2.11 18.09 4.96 9.29 15.24 9.29Z" />
    </Svg>
  );
}
