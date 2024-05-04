import { router, useNavigation } from "expo-router";
import { useAtomValue } from "jotai";
import { useEffect } from "react";
import { View } from "react-native";

import { trackDataAtom, trackListAtom } from "@/features/playback/api/track";

import { AnimatedCover } from "@/components/media/AnimatedCover";
import { TextLine } from "@/components/ui/Text";
import {
  NextButton,
  PlayToggleButton,
  PreviousButton,
  RepeatButton,
  ShuffleButton,
} from "@/features/playback/components/MediaControls";
import { MediaSlider } from "@/features/playback/components/MediaSlider";

/** @description Screen for `/current-track` route. */
export default function CurrentTrackScreen() {
  const navigation = useNavigation();
  const trackData = useAtomValue(trackDataAtom);
  const { reference } = useAtomValue(trackListAtom);

  useEffect(() => {
    if (!trackData) router.back();
    navigation.setOptions({ headerTitle: reference?.name ?? "" });
  }, [navigation, trackData, reference]);

  if (!trackData) return null;

  return (
    <View className="flex-1 items-center px-4 py-8">
      <AnimatedCover type="bottom" source={trackData.coverSrc} delay={300} />

      <View className="mt-auto w-full px-4">
        <TextLine
          numberOfLines={2}
          className="text-center font-geistMono text-xl text-foreground50"
        >
          {trackData.name}
        </TextLine>
        <TextLine className="text-center font-geistMonoLight text-base text-accent50">
          {trackData.artistName}
        </TextLine>
      </View>

      <MediaSlider duration={trackData.duration} />

      <View className="mt-4 flex-row items-center gap-2 p-8">
        <ShuffleButton size={32} />
        <PreviousButton size={32} />
        <PlayToggleButton size={32} className="px-5" />
        <NextButton size={32} />
        <RepeatButton size={32} />
      </View>
    </View>
  );
}
