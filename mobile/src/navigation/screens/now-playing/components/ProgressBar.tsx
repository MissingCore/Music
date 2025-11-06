import AudioWaveView from "@kaannn/react-native-waveform";
import { Slider as RNSlider } from "@miblanchard/react-native-slider";
import { View } from "react-native";
import { Slider } from "~/components/Form/Slider";
import { Colors } from "~/constants/Styles";
import { useCurrentTheme } from "~/hooks/useTheme";

interface ProgressBarProps {
  trackPath: string;
  value: number;
  max: number;
  onChange: (value: number) => void | Promise<void>;
  onInput: (value: number) => void | Promise<void>;
  inverted?: boolean;
  legacySlider?: boolean;
}

export function ProgressBar(props: ProgressBarProps) {
  const isDark = useCurrentTheme() === "dark";

  return props.legacySlider ? (
    <Slider
      value={props.value}
      max={props.max}
      onChange={props.onInput}
      onComplete={props.onChange}
      thumbSize={16}
      inverted={props.inverted}
    />
  ) : (
    <View className="relative isolate">
      <View className="flex h-14">
        <AudioWaveView
          style={{
            flex: 1,
            width: "100%",
            height: "100%",
            zIndex: 10,
            pointerEvents: "none",
            transform: props.inverted ? [{ rotate: "180deg" }] : [],
          }}
          progress={props.value}
          maxProgress={props.max}
          waveWidth={4}
          waveGap={4}
          waveMinHeight={4}
          waveCornerRadius={8}
          audioSource={props.trackPath}
          waveBackgroundColor={Colors.neutral40}
          waveProgressColor={Colors.red}
        />
        <RNSlider
          containerStyle={{
            position: "absolute",
            width: "100%",
            height: "100%",
            zIndex: 20,
          }}
          thumbStyle={{ height: "100%", width: 4 }}
          thumbTintColor={isDark ? Colors.neutral85 : Colors.neutral20}
          minimumTrackTintColor={Colors.transparent}
          maximumTrackTintColor={Colors.transparent}
          inverted={props.inverted}
          value={props.value}
          minimumValue={0}
          maximumValue={props.max}
          onValueChange={([newPos]) => props.onInput(newPos!)}
          onSlidingComplete={([newPos]) => props.onChange(newPos!)}
        />
      </View>
    </View>
  );
}
