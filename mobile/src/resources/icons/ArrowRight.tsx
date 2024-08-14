import { View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";

/** Thinner & sharp heroicons "arrow-right" icon. */
export function ArrowRight({
  size,
  color = Colors.foreground50,
  className,
}: {
  size: number;
  color?: string;
  /** Apply `className` to the `<View />` wrapping the SVG. */
  className?: string;
}) {
  return (
    <View className={cn("pointer-events-none", className)}>
      <Svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.25"
      >
        <Path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
      </Svg>
    </View>
  );
}
