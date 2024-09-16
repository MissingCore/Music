import { router } from "expo-router";
import { useAtomValue } from "jotai";
import { Pressable, View } from "react-native";

import { SyncAtomState } from "../services/State";

import { MediaImage } from "@/components/media/image";
import { TextStack } from "@/components/ui/text";
import { NextButton, PlayToggleButton, PreviousButton } from "./MediaControls";

/**
 * Displays a player that appears at the bottom of the screen if we have
 * a song loaded.
 */
export function MiniPlayer() {
  const track = useAtomValue(SyncAtomState.activeTrack);

  if (!track) return null;

  return (
    <View className="bg-canvas px-4">
      <Pressable
        onPress={() => router.navigate("/current-track")}
        className="flex-row items-center gap-2 border-t border-t-foreground50 p-2"
      >
        <MediaImage
          type="track"
          size={48}
          source={track.artwork}
          className="rounded"
        />
        <TextStack
          content={[track.name, track.artistName ?? "No Artist"]}
          colors={{ row1: "text-foreground50", row2: "text-accent50" }}
          wrapperClassName="flex-1"
        />
        <View className="flex-row items-center">
          <PreviousButton />
          <PlayToggleButton className="px-5" />
          <NextButton />
        </View>
      </Pressable>
    </View>
  );
}
