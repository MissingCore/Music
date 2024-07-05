import _Ionicons from "@expo/vector-icons/Ionicons";
import _MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { View } from "react-native";

import { Colors } from "@/constants/Styles";

type IconProps<IconNames extends string> = {
  name: IconNames;
  size?: number;
  color?: string;
};

export function Ionicons({
  name,
  size = 24,
  color = Colors.foreground50,
}: IconProps<React.ComponentProps<typeof _Ionicons>["name"]>) {
  return (
    <View className="pointer-events-none">
      <_Ionicons {...{ name, size, color }} />
    </View>
  );
}

export function MaterialIcons({
  name,
  size = 24,
  color = Colors.foreground50,
}: IconProps<React.ComponentProps<typeof _MaterialIcons>["name"]>) {
  return (
    <View className="pointer-events-none">
      <_MaterialIcons {...{ name, size, color }} />
    </View>
  );
}
