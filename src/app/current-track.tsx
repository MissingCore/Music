import { router, useNavigation } from "expo-router";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { Text, View } from "react-native";

import { AnimatedCover } from "@/components/media/AnimatedCover";
import { TextLine } from "@/components/ui/Text";
import { currentTrackDataAtom } from "@/features/playback/api/currentTrack";
import {
  NextButton,
  PlayButton,
  PreviousButton,
  RepeatButton,
  ShuffleButton,
} from "@/features/playback/components/MediaControls";
import { getTrackDuration } from "@/features/track/components/TrackDuration";

/** @description Screen for `/current-track` route. */
export default function CurrentTrackScreen() {
  const navigation = useNavigation();
  const trackData = useAtomValue(currentTrackDataAtom);

  useEffect(() => {
    if (!trackData) router.back();

    navigation.setOptions({
      headerTitle: "Playing Track From <>",
    });
  }, [navigation, trackData]);

  if (!trackData) return null;

  return (
    <View className="flex-1 items-center px-4 py-8">
      <AnimatedCover type="bottom" imgSrc={trackData.coverSrc} delay={300} />

      <View className="mt-auto w-full px-8">
        <TextLine className="text-center font-geistMono text-xl text-foreground50">
          {trackData.name}
        </TextLine>
        <TextLine className="text-center font-geistMonoLight text-base text-accent50">
          {trackData.artistName}
        </TextLine>
      </View>

      <View className="mt-auto w-full p-4">
        <View className="mb-2 h-4 w-full rounded-lg bg-foreground100" />
        <View className="flex-row justify-between">
          <Text className="font-geistMono text-sm text-foreground50">
            00:00
          </Text>
          <Text className="font-geistMono text-sm text-foreground50">
            {getTrackDuration(trackData.duration)}
          </Text>
        </View>
      </View>

      <View className="mt-auto flex-row items-center gap-2 p-8">
        <ShuffleButton size={32} />
        <PreviousButton size={32} />
        <PlayButton size={32} className="px-5" />
        <NextButton size={32} />
        <RepeatButton size={32} />
      </View>
    </View>
  );
}
