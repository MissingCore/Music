import { Slider } from "@miblanchard/react-native-slider";
import { useAtom, useSetAtom } from "jotai";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

import { updateTrackPosAtom } from "../api/actions";
import { positionMsAtom } from "../api/track";

import { Colors } from "@/constants/Styles";
import { getTrackDuration } from "@/features/track/utils";

/**
 * @description Allows seeking on the current track & displays the
 *  current track position.
 */
export function Timeline({ duration }: { duration: number }) {
  const updateTrackPos = useSetAtom(updateTrackPosAtom);
  const [trackPosMs, setTrackPosMs] = useAtom(positionMsAtom);
  const prevDuration = useRef(0);
  const [isSliding, setIsSliding] = useState(false);
  const [slidingTrackPos, setSlidingTrackPos] = useState<number | null>(null);

  useEffect(() => {
    // Preserve scrub percentage position.
    if (duration !== prevDuration.current) {
      if (slidingTrackPos !== null) {
        setSlidingTrackPos(duration * (slidingTrackPos / prevDuration.current));
      }
      prevDuration.current = duration;
    }
  }, [duration, slidingTrackPos]);

  return (
    <View className="w-full p-4">
      <Slider
        value={slidingTrackPos ?? trackPosMs}
        minimumValue={0}
        maximumValue={Math.floor(duration * 1000)}
        onSlidingStart={() => setIsSliding(true)}
        onSlidingComplete={() => {
          updateTrackPos();
          setIsSliding(false);
          setSlidingTrackPos(null);
        }}
        onValueChange={([newPosMs]) => {
          if (isSliding) setSlidingTrackPos(Math.floor(newPosMs!));
          setTrackPosMs(Math.floor(newPosMs!));
        }}
        minimumTrackTintColor={Colors.accent500}
        maximumTrackTintColor={Colors.surface500}
        thumbTintColor={Colors.foreground50}
        trackStyle={{ height: 8, borderRadius: 24 }}
      />

      <View className="flex-row justify-between">
        <Text className="font-geistMono text-sm text-foreground50">
          {getTrackDuration((slidingTrackPos ?? trackPosMs) / 1000)}
        </Text>
        <Text className="font-geistMono text-sm text-foreground50">
          {getTrackDuration(duration)}
        </Text>
      </View>
    </View>
  );
}
