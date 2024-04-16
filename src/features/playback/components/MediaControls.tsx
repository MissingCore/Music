import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Pressable, View } from "react-native";

import { repeatAtom, shuffleAtom } from "../api/configs";
import { isPlayingAtom, toggleIsPlayingAtom } from "../api/controls";

import Colors from "@/constants/Colors";
import { cn } from "@/lib/style";

/** @description Media control used on `(current)` routes. */
export function MediaControls() {
  return (
    <View className="flex-row items-center gap-4">
      <MediaToggleButton type="repeat" atom={repeatAtom} />
      <MediaToggleButton type="shuffle" atom={shuffleAtom} />
      <PlayButton />
    </View>
  );
}

/** @description Reusable toggleable media control button. */
export function MediaToggleButton(props: {
  type: "repeat" | "shuffle";
  atom: typeof repeatAtom;
  size?: number;
}) {
  const [isActive, setIsActive] = useAtom(props.atom);

  const size = props.size ?? 24;
  if (isActive.state !== "hasData") {
    return (
      <Ionicons
        name={`${props.type}-sharp`}
        size={size}
        color={Colors.surface500}
      />
    );
  }

  return (
    <Pressable onPress={() => setIsActive(!isActive.data)}>
      <Ionicons
        name={`${props.type}-sharp`}
        size={size}
        color={isActive.data ? Colors.accent500 : Colors.foreground50}
      />
    </Pressable>
  );
}

/** @description Toggles whether we're playing or not. */
export function PlayButton({ size = 24 }) {
  const isPlaying = useAtomValue(isPlayingAtom);
  const toggleIsPlaying = useSetAtom(toggleIsPlayingAtom);

  return (
    <Pressable
      onPress={toggleIsPlaying}
      className={cn("rounded-full bg-accent500 p-1", {
        "bg-surface500": isPlaying,
      })}
    >
      <MaterialIcons
        name={isPlaying ? "pause" : "play-arrow"}
        size={size}
        color={Colors.foreground50}
      />
    </Pressable>
  );
}
