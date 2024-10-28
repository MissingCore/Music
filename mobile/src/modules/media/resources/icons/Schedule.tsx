import Svg, { Path } from "react-native-svg";

import { useTheme } from "@/hooks/useTheme";

export function Schedule({
  size = 24,
  color,
}: {
  size?: number;
  color?: string;
}) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="m611-296 53-53-146-146.22V-677h-75v212l168 169ZM480-90q-80.91 0-152.07-30.76-71.15-30.77-123.79-83.5Q151.5-257 120.75-328.09 90-399.17 90-480q0-80.91 30.76-152.07 30.77-71.15 83.5-123.79Q257-808.5 328.09-839.25 399.17-870 480-870q80.91 0 152.07 30.76 71.15 30.77 123.79 83.5Q808.5-703 839.25-631.91 870-560.83 870-480q0 80.91-30.76 152.07-30.77 71.15-83.5 123.79Q703-151.5 631.91-120.75 560.83-90 480-90Zm0-390Zm0 315q130.5 0 222.75-92.25T795-480q0-130.5-92.25-222.75T480-795q-130.5 0-222.75 92.25T165-480q0 130.5 92.25 222.75T480-165Z" />
    </Svg>
  );
}
