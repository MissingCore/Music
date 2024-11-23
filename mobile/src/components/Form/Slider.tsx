import { Slider as RNSlider } from "@miblanchard/react-native-slider";

import { useTheme } from "@/hooks/useTheme";

import { Colors } from "@/constants/Styles";

/** Slider with default styling. */
export function Slider(props: {
  value: number;
  max: number;
  thumbSize: number;
  onChange: (value: number) => void | Promise<void>;
  onComplete?: (value: number) => void | Promise<void>;
}) {
  const { onSurface } = useTheme();
  return (
    <RNSlider
      value={props.value}
      minimumValue={0}
      maximumValue={props.max}
      onSlidingComplete={async ([newPos]) => {
        if (props.onComplete) await props.onComplete(newPos!);
      }}
      onValueChange={async ([newPos]) => await props.onChange(newPos!)}
      minimumTrackTintColor={Colors.red}
      maximumTrackTintColor={onSurface}
      thumbTintColor={Colors.red}
      thumbStyle={{ height: props.thumbSize, width: props.thumbSize }}
      trackStyle={{ height: props.thumbSize / 2, borderRadius: 999 }}
    />
  );
}
