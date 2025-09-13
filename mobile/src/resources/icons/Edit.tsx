import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function Edit({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M204.04-204.04h47.23L661.54-614 614-661.54 204.04-250.96v46.92Zm-21.73 55.96q-14.25 0-24.24-9.99-9.99-9.99-9.99-24.24v-64.02q0-13.76 5.35-26.39 5.36-12.64 14.92-22.12L669.23-796q8.24-7.52 18.26-11.72 10.01-4.2 21.2-4.2t21.69 4.11q10.5 4.12 19.2 12.43L796-748.65q8.31 8.19 12.11 18.54 3.81 10.35 3.81 20.93 0 11.49-3.86 21.68-3.85 10.19-12.06 18.38L294.84-168.35q-9.44 9.56-22.02 14.92-12.58 5.35-26.55 5.35h-63.96Zm574.04-560.96-47.31-47.31 47.31 47.31Zm-118.87 71.56L614-661.54 661.54-614l-24.06-23.48Z" />
    </Svg>
  );
}
