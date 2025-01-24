import Svg, { Path } from "react-native-svg";

import { useTheme } from "~/hooks/useTheme";
import type { Icon } from "./type";

export function LibraryMusic({ size = 24, color }: Icon) {
  const { foreground } = useTheme();
  const usedColor = color ?? foreground;
  return (
    <Svg width={size} height={size} viewBox="0 -960 960 960" fill={usedColor}>
      <Path d="M491.4-366.15q36.92 0 62.26-25.33Q579-416.8 579-452.92v-223h112.19v-68.35H544.42v224.54q-11.35-10.38-24.65-15.58-13.31-5.19-28.32-5.19-36.95 0-62.28 25.44-25.32 25.44-25.32 61.95 0 36.5 25.32 61.73 25.32 25.23 62.23 25.23ZM250-260v-591.92h591.92V-260H250Zm55.96-55.96h480v-480h-480v480ZM118.08-128.08v-579.61h55.96v523.65h523.65v55.96H118.08Zm187.88-667.88v480-480Z" />
    </Svg>
  );
}
