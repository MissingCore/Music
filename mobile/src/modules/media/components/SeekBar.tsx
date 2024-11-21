import { Slider } from "@miblanchard/react-native-slider";
import { useState } from "react";
import { View } from "react-native";
import { useProgress } from "react-native-track-player";

import { useTheme } from "@/hooks/useTheme";
import { MusicControls } from "../services/Playback";

import { Colors } from "@/constants/Styles";
import { formatSeconds } from "@/utils/number";
import { StyledText } from "@/components/new/Typography";

/**
 * Allows seeking on the current track & displays the current track
 * position.
 */
export function SeekBar({ duration }: { duration: number }) {
  const { onSurface } = useTheme();
  const { position } = useProgress(200);
  const [slidingTrackPos, setSlidingTrackPos] = useState<number | null>(null);

  const displayedPos = slidingTrackPos ?? position;
  const clampedPos = displayedPos > duration ? duration : displayedPos;

  return (
    <View className="w-full">
      <Slider
        value={clampedPos}
        minimumValue={0}
        maximumValue={duration}
        onSlidingComplete={async ([newPos]) => {
          await MusicControls.seekTo(newPos!);
          // Helps prevents "rubberbanding".
          setTimeout(() => setSlidingTrackPos(null), 250);
        }}
        onValueChange={([newPos]) => setSlidingTrackPos(newPos!)}
        minimumTrackTintColor={Colors.red}
        maximumTrackTintColor={onSurface}
        thumbTintColor={Colors.red}
        trackStyle={{ height: 8, borderRadius: 24 }}
      />

      <View className="flex-row justify-between">
        <StyledText className="text-sm">{formatSeconds(clampedPos)}</StyledText>
        <StyledText className="text-sm">{formatSeconds(duration)}</StyledText>
      </View>
    </View>
  );
}
