import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useAtomValue, useSetAtom } from "jotai";
import { Pressable, View } from "react-native";

import { usePlaybackConfig } from "../api/getPlaybackConfig";
import { useToggleControl } from "../api/toggleControl";
import { isPlayingAtom, toggleIsPlayingAtom } from "../api/playTrack";

import Colors from "@/constants/Colors";
import { mutateGuard } from "@/lib/react-query";
import { cn } from "@/lib/style";
import type { ToggleableControls } from "../types";

/** @description Media control used on `(current)` routes. */
export function MediaControls() {
  return (
    <View className="flex-row items-center gap-4">
      <MediaToggleButton type="repeat" />
      <MediaToggleButton type="shuffle" />
      <PlayButton />
    </View>
  );
}

type MediaToggleButtonProps = {
  type: ToggleableControls;
  size?: number;
};

/** @description Reusable toggleable media control button. */
export function MediaToggleButton({ type, size = 24 }: MediaToggleButtonProps) {
  const { isPending, error, data } = usePlaybackConfig(type);
  const toggleMutation = useToggleControl(type);

  if (isPending || error) {
    return (
      <Ionicons name={`${type}-sharp`} size={size} color={Colors.surface500} />
    );
  }

  // Add optimistic UI updates.
  const isToggled = toggleMutation.isPending ? !data : data;

  return (
    <Pressable onPress={() => mutateGuard(toggleMutation, data)}>
      <Ionicons
        name={`${type}-sharp`}
        size={size}
        color={isToggled ? Colors.accent500 : Colors.foreground50}
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
