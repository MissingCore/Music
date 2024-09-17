import { Stack } from "expo-router";
import { useMemo, useState } from "react";
import { View, useWindowDimensions } from "react-native";

import { useMusicStore } from "@/modules/media/services/next/Music";

import { AnimatedVinyl } from "@/components/media/animated-vinyl";
import { Back } from "@/components/navigation/back";
import { Heading, TextLine } from "@/components/ui/text";
import {
  NextButton,
  PlayToggleButton,
  PreviousButton,
  RepeatButton,
  ShuffleButton,
} from "@/modules/media/components/MediaControls";
import { SeekBar } from "@/modules/media/components/SeekBar";

/** Screen for `/current-track` route. */
export default function CurrentTrackScreen() {
  const { width } = useWindowDimensions();
  const track = useMusicStore((state) => state.activeTrack);
  const listName = useMusicStore((state) => state.sourceName);
  const isPlaying = useMusicStore((state) => state.isPlaying);
  const [pageHeight, setPageHeight] = useState<number | null>(null);
  const [infoHeight, setInfoHeight] = useState<number | null>(null);

  const availableLength = useMemo(() => {
    if (pageHeight === null || infoHeight === null) return undefined;
    // Exclude the vertical padding on container plus a bit more.
    const usedHeight = pageHeight - infoHeight - 48;
    const imgSize = (usedHeight * 2) / 3;
    return imgSize > width - 32 ? (width - 32) * 1.5 : usedHeight;
  }, [width, pageHeight, infoHeight]);

  if (!track) return <Back />;

  return (
    <>
      <Stack.Screen options={{ headerTitle: listName }} />
      <View
        onLayout={({ nativeEvent }) => setPageHeight(nativeEvent.layout.height)}
        className="flex-1 items-center px-4 py-8"
      >
        {availableLength !== undefined && (
          <AnimatedVinyl
            placement="bottom"
            source={track.artwork}
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
              className="h-[58px] align-bottom"
            >
              {track.name}
            </Heading>
            <TextLine className="text-center font-geistMonoLight text-base text-accent50">
              {track.artistName}
            </TextLine>
          </View>

          <SeekBar duration={track.duration} />

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
