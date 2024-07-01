import { Stack } from "expo-router";
import { useAtomValue } from "jotai";
import { useMemo, useState } from "react";
import { View, useWindowDimensions } from "react-native";

import { isPlayingAtom } from "@/features/playback/api/actions";
import { trackDataAtom, trackListAtom } from "@/features/playback/api/track";

import { AnimatedVinyl } from "@/components/media/animated-vinyl";
import { Back } from "@/components/navigation/back";
import { Heading, TextLine } from "@/components/ui/text";
import {
  NextButton,
  PlayToggleButton,
  PreviousButton,
  RepeatButton,
  ShuffleButton,
} from "@/features/playback/components/media-controls";
import { Timeline } from "@/features/playback/components/timeline";

/** @description Screen for `/current-track` route. */
export default function CurrentTrackScreen() {
  const { width } = useWindowDimensions();
  const trackData = useAtomValue(trackDataAtom);
  const { reference } = useAtomValue(trackListAtom);
  const isPlaying = useAtomValue(isPlayingAtom);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const [infoHeight, setInfoHeight] = useState<number | null>(null);

  const availableLength = useMemo(() => {
    if (pageHeight === null || infoHeight === null) return undefined;
    // Exclude the vertical padding on container plus a bit more.
    const usedHeight = pageHeight - infoHeight - 48;
    const imgSize = (usedHeight * 2) / 3;
    return imgSize > width - 32 ? (width - 32) * 1.5 : usedHeight;
  }, [width, pageHeight, infoHeight]);

  if (!trackData) return <Back />;

  return (
    <>
      <Stack.Screen options={{ headerTitle: reference?.name ?? "" }} />
      <View
        onLayout={({ nativeEvent }) => setPageHeight(nativeEvent.layout.height)}
        className="flex-1 items-center px-4 py-8"
      >
        {availableLength !== undefined && (
          <AnimatedVinyl
            placement="bottom"
            source={trackData.artwork}
            availableLength={availableLength}
            delay={300}
            shouldSpin={isPlaying}
          />
        )}

        <View
          onLayout={({ nativeEvent }) =>
            setInfoHeight(nativeEvent.layout.height)
          }
          className="mt-auto w-full items-center"
        >
          <View className="w-full px-4">
            <Heading
              as="h3"
              numberOfLines={2}
              className="h-[58px] align-bottom font-geistMono"
            >
              {trackData.name}
            </Heading>
            <TextLine className="text-center font-geistMonoLight text-base text-accent50">
              {trackData.artistName}
            </TextLine>
          </View>

          <Timeline duration={trackData.duration} />

          <View className="flex-row items-center gap-2 p-4 pb-8">
            <ShuffleButton size={32} />
            <PreviousButton size={32} />
            <PlayToggleButton size={32} className="px-5" />
            <NextButton size={32} />
            <RepeatButton size={32} />
          </View>
        </View>
      </View>
    </>
  );
}
