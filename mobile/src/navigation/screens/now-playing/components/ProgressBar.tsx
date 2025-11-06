import AudioWaveView from "@kaannn/react-native-waveform";
import { Slider as RNSlider } from "@miblanchard/react-native-slider";
import { View } from "react-native";

import { usePreferenceStore } from "~/stores/Preference/store";
import { useTheme } from "~/hooks/useTheme";

import { Colors } from "~/constants/Styles";
import { Slider } from "~/components/Form/Slider";

interface ProgressBarProps {
  trackPath: string;
  value: number;
  max: number;
  onChange: (value: number) => void | Promise<void>;
  onComplete: (value: number) => void | Promise<void>;
  inverted?: boolean;
}

export function ProgressBar(props: ProgressBarProps) {
  const { onSurface } = useTheme();
  const waveformSlider = usePreferenceStore((s) => s.waveformSlider);

  if (!waveformSlider) return <Slider {...props} thumbSize={16} />;
  return (
    <View className="relative h-12">
      <AudioWaveView
        audioSource={props.trackPath}
        progress={props.value}
        maxProgress={props.max}
        waveMinHeight={8}
        waveWidth={6}
        waveGap={4}
        waveCornerRadius={8}
        waveBackgroundColor={onSurface}
        waveProgressColor={Colors.red}
        style={{ width: "100%", height: "100%" }}
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
