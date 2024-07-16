import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { Colors } from "@/constants/Styles";

/** Thinner ionicons "ellipsis-vertical" icon. */
export function EllipsisVertical({
  size,
  color = Colors.foreground50,
}: {
  size: number;
  color?: string;
}) {
  return (
    <View className="pointer-events-none">
      <Svg width={size} height={size} viewBox="0 0 512 512" fill={color}>
        <Circle cx="256" cy="76" r="36" />
        <Circle cx="256" cy="256" r="36" />
        <Circle cx="256" cy="436" r="36" />
      </Svg>
    </View>
  );
}
