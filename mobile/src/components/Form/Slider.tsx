import { Slider as RNSlider } from "@miblanchard/react-native-slider";

import { useTheme } from "~/hooks/useTheme";

//#region Regular
/** Slider with default styling. */
export function Slider(props: {
  value: number;
  max: number;
  thumbSize: number;
  onChange: (value: number) => void | Promise<void>;
  onComplete?: (value: number) => void | Promise<void>;
  inverted?: boolean;
}) {
  const { primary, surfaceContainerHigh } = useTheme();
  return (
    <RNSlider
      value={props.value}
      minimumValue={0}
      maximumValue={props.max}
      onSlidingComplete={async ([newPos]) => {
        if (props.onComplete) await props.onComplete(newPos!);
      }}
      onValueChange={async ([newPos]) => await props.onChange(newPos!)}
      minimumTrackTintColor={primary}
      maximumTrackTintColor={surfaceContainerHigh}
      thumbTintColor={primary}
      thumbStyle={{ height: props.thumbSize, width: props.thumbSize }}
      trackStyle={{ height: props.thumbSize / 2, borderRadius: 999 }}
      containerStyle={{ height: props.thumbSize + 16 }}
      inverted={props.inverted}
    />
  );
}
//#endregion
