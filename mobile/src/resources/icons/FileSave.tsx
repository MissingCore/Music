import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function FileSave({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M720-137.15 863.04-280 824-319.04l-75.92 76.12v-184.16h-55.96v184.16L616-319.04 577.15-280 720-137.15ZM572.12-12.12v-55.96h295.96v55.96H572.12Zm-331.74-160q-27.87 0-48.07-20.19-20.19-20.2-20.19-48.07v-559.43q0-27.67 20.19-47.97 20.2-20.3 48.07-20.3h278.81l228.89 228.89v128.46h-55.96v-101.39h-200v-200H240.38q-4.8 0-8.55 3.85-3.75 3.85-3.75 8.46v559.43q0 4.8 3.75 8.55 3.75 3.75 8.55 3.75h248.08v55.96H240.38Zm-12.3-55.96v-584.04V-228.08Z" />
    </Svg>
  );
}
