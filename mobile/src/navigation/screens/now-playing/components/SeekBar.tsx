import { Slider as RNSlider } from "@miblanchard/react-native-slider";
import { I18nManager, View } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { Waveform, useWaveformSamples } from "./Waveform";
import { usePlayerProgress } from "../helpers/usePlayerProgress";

import { Colors } from "~/constants/Styles";
import { OnRTL } from "~/lib/react";
import { formatSeconds } from "~/utils/number";
import { Slider } from "~/components/Form/Slider";
import { StyledText } from "~/components/Typography/StyledText";

interface SeekBarProps {
  id: string;
  uri: string;
  trackLength: number;
}

export function SeekBar(props: SeekBarProps) {
  const { position, setPosition, seekToPosition } = usePlayerProgress();

  const clampedPos =
    position > props.trackLength ? props.trackLength : position;

  return (
    <View>
      <ProgressBar
        trackId={props.id}
        trackPath={props.uri}
        value={clampedPos}
        max={props.trackLength}
        onChange={setPosition}
        onComplete={seekToPosition}
        inverted={I18nManager.isRTL}
      />
      <View
        style={{ flexDirection: OnRTL.decide("row-reverse", "row") }}
        className="justify-between"
      >
        <StyledText className="text-sm">{formatSeconds(clampedPos)}</StyledText>
        <StyledText className="text-sm">
          {formatSeconds(props.trackLength)}
        </StyledText>
      </View>
    </View>
  );
}

interface ProgressBarProps {
  trackId: string;
  trackPath: string;
  value: number;
  max: number;
  onChange: (value: number) => void | Promise<void>;
  onComplete: (value: number) => void | Promise<void>;
  inverted?: boolean;
}

function ProgressBar(props: ProgressBarProps) {
  const waveformSlider = usePreferenceStore((s) => s.waveformSlider);
  const samples = useWaveformSamples(props.trackId, props.trackPath);

  if (!waveformSlider) return <Slider {...props} thumbSize={16} />;
  return (
    <View className="relative h-12">
      <Waveform
        amplitudes={samples}
        height={48}
        progress={props.value}
        maxProgress={props.max}
      />
      <RNSlider
        value={props.value}
        minimumValue={0}
        maximumValue={props.max}
        onSlidingComplete={([newPos]) => props.onComplete(newPos!)}
        onValueChange={([newPos]) => props.onChange(newPos!)}
        maximumTrackTintColor={Colors.transparent}
        minimumTrackTintColor={Colors.transparent}
        thumbTintColor={Colors.transparent}
        thumbStyle={{ width: 0 }}
        containerStyle={{ position: "absolute", width: "100%", height: "100%" }}
        inverted={props.inverted}
      />
    </View>
  );
}
