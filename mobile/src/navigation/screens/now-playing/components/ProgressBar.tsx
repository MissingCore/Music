import { Slider as RNSlider } from "@miblanchard/react-native-slider";
import { View } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { Waveform, useWaveformSamples } from "./Waveform";

import { Colors } from "~/constants/Styles";
import { Slider } from "~/components/Form/Slider";

interface ProgressBarProps {
  trackId: string;
  trackPath: string;
  value: number;
  max: number;
  onChange: (value: number) => void | Promise<void>;
  onComplete: (value: number) => void | Promise<void>;
  inverted?: boolean;
}

export function ProgressBar(props: ProgressBarProps) {
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
