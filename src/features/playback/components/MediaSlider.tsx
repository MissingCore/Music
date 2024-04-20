import Slider from "@react-native-community/slider";
import { useAtom, useAtomValue, useSetAtom } from "jotai";
import { Text, View } from "react-native";

import { updateTrackPosAtom } from "../api/controls";
import { currentTrackDataAtom, trackPositionMsAtom } from "../api/playing";

import Colors from "@/constants/Colors";
import { getTrackDuration } from "@/features/track/components/TrackDuration";

/** @description Allows seeking on the current track. */
export function MediaSlider() {
  const updateTrackPos = useSetAtom(updateTrackPosAtom);
  const trackData = useAtomValue(currentTrackDataAtom);
  const [trackPosMs, setTrackPosMs] = useAtom(trackPositionMsAtom);

  if (!trackData) return null;

  return (
    <View className="mt-16 w-full p-4">
      <Slider
        value={trackPosMs}
        minimumValue={0}
        maximumValue={Math.floor(trackData.duration * 1000)}
        onSlidingComplete={updateTrackPos}
        onValueChange={setTrackPosMs}
        minimumTrackTintColor={Colors.accent500}
        maximumTrackTintColor={Colors.surface50}
        thumbTintColor={Colors.foreground50}
      />

      <View className="flex-row justify-between">
        <Text className="font-geistMono text-sm text-foreground50">
          {getTrackDuration(trackPosMs / 1000)}
        </Text>
        <Text className="font-geistMono text-sm text-foreground50">
          {getTrackDuration(trackData.duration)}
        </Text>
      </View>
    </View>
  );
}
