import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Pressable, View } from "react-native";

import Colors from "@/constants/Colors";

/** @description Media control used on `(current)` routes. */
export function MediaControl() {
  return (
    <View className="flex-row items-center gap-4">
      <Pressable onPress={() => console.log("Pressed `Loop` button.")}>
        <Ionicons name="repeat-sharp" size={24} color={Colors.foreground50} />
      </Pressable>
      <Pressable onPress={() => console.log("Pressed `Shuffle` button.")}>
        <Ionicons name="shuffle-sharp" size={24} color={Colors.accent500} />
      </Pressable>
      <Pressable
        onPress={() => console.log("Pressed `Play` button.")}
        className="rounded-full bg-accent500 p-1"
      >
        <MaterialIcons
          name="play-arrow"
          size={24}
          color={Colors.foreground50}
        />
      </Pressable>
    </View>
  );
}
