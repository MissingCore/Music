import { Slider } from "@miblanchard/react-native-slider";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { useState } from "react";
import { Text, View } from "react-native";

import { updateTrackPosAtom } from "../api/controls";
import { currentTrackDataAtom, trackPositionMsAtom } from "../api/playing";

import Colors from "@/constants/Colors";
import { getTrackDuration } from "@/features/track/components/TrackDuration";

/**
 * @description Allows seeking on the current track & displays the
 *  current track position.
 */
export function MediaSlider() {
  const updateTrackPos = useSetAtom(updateTrackPosAtom);
  const trackData = useAtomValue(currentTrackDataAtom);
  const [trackPosMs, setTrackPosMs] = useAtom(trackPositionMsAtom);
  const [isSliding, setIsSliding] = useState(false);
  const [slidingTrackPos, setSlidingTrackPos] = useState<number | null>(null);

  if (!trackData) return null;

  return (
    <View className="mt-16 w-full p-4">
      <Slider
        value={slidingTrackPos ?? trackPosMs}
        minimumValue={0}
        maximumValue={Math.floor(trackData.duration * 1000)}
        onSlidingStart={() => setIsSliding(true)}
        onSlidingComplete={() => {
          updateTrackPos();
          setIsSliding(false);
          setSlidingTrackPos(null);
        }}
        onValueChange={([newPosMs]) => {
          if (isSliding) setSlidingTrackPos(Math.floor(newPosMs));
          setTrackPosMs(Math.floor(newPosMs));
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
          {getTrackDuration(trackData.duration)}
        </Text>
      </View>
    </View>
  );
}
