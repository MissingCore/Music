import { Slider } from "@miblanchard/react-native-slider";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import {
  State,
  usePlaybackState,
  useProgress,
} from "react-native-track-player";

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
  const { state: playbackState } = usePlaybackState();
  const { position } = useProgress(200);
  const prevDuration = useRef(0);
  const [isLifted, setIsLifted] = useState(true);
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
    // Prevent "rubberbanding" when we seeked to the end of the seekbar.
    if (isLifted && playbackState === State.Loading) setSlidingTrackPos(null);
    // Preserve scrub percentage position.
    if (duration !== prevDuration.current) {
      if (!isLifted && slidingTrackPos !== null) {
        setSlidingTrackPos(duration * (slidingTrackPos / prevDuration.current));
      }
      prevDuration.current = duration;
    }
  }, [playbackState, duration, isLifted, slidingTrackPos]);

  const displayedPos = slidingTrackPos ?? position;
  const clampedPos = displayedPos > duration ? duration : displayedPos;

  return (
    <View className="w-full p-4">
      <Slider
        value={clampedPos}
        minimumValue={0}
        maximumValue={duration}
        onSlidingStart={() => setIsLifted(false)}
        onSlidingComplete={async ([newPos]) => {
          setIsLifted(true);
          await MusicControls.seekTo(newPos!);
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
