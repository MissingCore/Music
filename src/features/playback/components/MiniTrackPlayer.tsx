import { router } from "expo-router";
import { useAtomValue } from "jotai";
import { Pressable, View } from "react-native";

import { currentTrackDataAtom } from "../api/currentTrack";

import { MediaImage } from "@/components/media/MediaImage";
import { TextStack } from "@/components/ui/Text";
import { NextButton, PlayToggleButton, PreviousButton } from "./MediaControls";

/**
 * @description Displays a player that appears at the bottom of the
 *  screen if we have a song loaded.
 */
export function MiniTrackPlayer() {
  const trackData = useAtomValue(currentTrackDataAtom);

  if (!trackData) return null;

  return (
    <Pressable
      onPress={() => router.navigate("/current-track")}
      className="mx-4 flex-row items-center gap-2 border-t border-t-foreground50 bg-canvas p-2"
    >
      <MediaImage
        type="track"
        imgSize={48}
        imgSrc={trackData.coverSrc}
        className="rounded"
      />
      <TextStack
        content={[trackData.name, trackData.artistName]}
        colors={{ row1: "text-foreground50", row2: "text-accent50" }}
        wrapperClassName="flex-1"
      />
      <View className="flex-row items-center">
        <PreviousButton />
        <PlayToggleButton className="px-5" />
        <NextButton />
      </View>
    </Pressable>
  );
}
