import { Slider } from "@miblanchard/react-native-slider";
import { useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { useProgress } from "react-native-track-player";

import { Colors } from "@/constants/Styles";
import { getTrackDuration } from "@/features/track/utils";
import { seekAtom } from "../services/Playback";

/**
 * Allows seeking on the current track & displays the current track
 * position.
 */
export function SeekBar({ duration }: { duration: number }) {
  const { position } = useProgress(200);
  const prevDuration = useRef(0);
  const seekToFn = useSetAtom(seekAtom);
  const [slidingTrackPos, setSlidingTrackPos] = useState<number | null>(null);

  useEffect(() => {
    // To prevent "rubberbanding" as `useProgress()` takes an "extra frame"
    // before it displayed the seeked position (±1 second in case `position`
    // isn't exactly the same).
    if (slidingTrackPos !== null) {
      if (
        position === slidingTrackPos ||
        (position >= slidingTrackPos - 1 && position <= slidingTrackPos + 1)
      )
        setSlidingTrackPos(null);
    }
  }, [position, slidingTrackPos]);

  useEffect(() => {
    // Preserve scrub percentage position.
    if (duration !== 0 && duration !== prevDuration.current) {
      if (slidingTrackPos !== null) {
        setSlidingTrackPos(duration * (slidingTrackPos / prevDuration.current));
      }
      prevDuration.current = duration;
    }
  }, [duration, slidingTrackPos]);

  return (
    <View className="w-full p-4">
      <Slider
        value={slidingTrackPos ?? position}
        minimumValue={0}
        maximumValue={duration}
        onSlidingComplete={([newPos]) => seekToFn(newPos!)}
        onValueChange={([newPos]) => setSlidingTrackPos(newPos!)}
        minimumTrackTintColor={Colors.accent500}
        maximumTrackTintColor={Colors.surface500}
        thumbTintColor={Colors.foreground50}
        trackStyle={{ height: 8, borderRadius: 24 }}
      />

      <View className="flex-row justify-between">
        <Text className="font-geistMono text-sm text-foreground50">
          {getTrackDuration(slidingTrackPos ?? position)}
        </Text>
        <Text className="font-geistMono text-sm text-foreground50">
          {getTrackDuration(duration)}
        </Text>
      </View>
    </View>
  );
}
