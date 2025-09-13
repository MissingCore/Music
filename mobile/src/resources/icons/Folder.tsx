import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function Folder({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M176.26-188.08q-28.35 0-48.27-19.91-19.91-19.92-19.91-48.3v-447.42q0-28.38 19.91-48.3 19.92-19.91 48.36-19.91h191.3q13.74 0 26.44 5.35 12.69 5.36 22.1 14.88l55.73 55.73h311.82q28.35 0 48.27 19.92 19.91 19.91 19.91 48.35v371.34q0 28.44-19.91 48.36-19.92 19.91-48.27 19.91H176.26Zm.09-55.96h607.3q5.39 0 8.85-3.46t3.46-8.85v-371.34q0-5.39-3.46-8.85t-8.85-3.46H449l-72.5-72.5q-1.92-1.92-4.04-2.69-2.11-.77-4.42-.77H176.35q-5.39 0-8.85 3.46t-3.46 8.85v447.3q0 5.39 3.46 8.85t8.85 3.46Zm-12.31 0v-471.92V-244.04Z" />
    </Svg>
  );
}
