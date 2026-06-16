import Svg, { Circle } from "react-native-svg";

import type { AppColor } from "~/modules/customization/theme/core/constants";
import { useColor } from "~/modules/customization/theme/hooks";

// Custom SVG made in Figma.
export function NothingArrowRight({
  size = 24,
  color,
}: {
  /** Defaults to `24px`. */
  size?: number;
  /** Defaults to theme's `onSurface` color. */
  color?: AppColor;
}) {
  const usedColor = useColor(color, "onSurface");
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={usedColor}>
      <Circle cx="9" cy="18" r="1" />
      <Circle cx="12" cy="15" r="1" />
      <Circle cx="15" cy="12" r="1" />
      <Circle cx="12" cy="9" r="1" />
      <Circle cx="9" cy="6" r="1" />
    </Svg>
  );
}
