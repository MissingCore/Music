import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function Delete({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M294.73-148.08q-28.26 0-48.26-20-20.01-20.01-20.01-48.27v-501.23h-39.19v-55.89h174.35v-33.84h237.57v33.77h174.35v55.96h-39.2v501.32q0 28.35-19.91 48.27-19.92 19.91-48.35 19.91H294.73Zm383.65-569.5H282.42v501.23q0 5.39 3.46 8.85 3.47 3.46 8.85 3.46h371.35q4.61 0 8.46-3.84 3.84-3.85 3.84-8.47v-501.23ZM380.19-282.92h55.96v-355.96h-55.96v355.96Zm144.46 0h55.96v-355.96h-55.96v355.96ZM282.42-717.58V-204.04v-513.54Z" />
    </Svg>
  );
}
