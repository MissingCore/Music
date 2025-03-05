import { Slider as RNSlider } from "@miblanchard/react-native-slider";
import { useState } from "react";
import { Pressable, View } from "react-native";

import { useTheme } from "~/hooks/useTheme";

import { Colors } from "~/constants/Styles";
import { cn } from "~/lib/style";
import { StyledText } from "../Typography/StyledText";

//#region Regular
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
      containerStyle={{ height: props.thumbSize }}
    />
  );
}
//#endregion

//#region Nothing Slider
/** Custom slider design to match the one in the Nothing X app. */
export function NSlider(
  props: NMarkProps & { label: string; icon: React.ReactNode },
) {
  const { surface } = useTheme();
  const [width, setWidth] = useState<number>();

  const formattedValue = props.formatValue(props.value);

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      className="relative overflow-hidden rounded-full"
    >
      <View
        accessible
        accessibilityLabel={`${props.label}: ${formattedValue}`}
        pointerEvents="none"
        className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex-row items-center gap-2"
      >
        {props.icon}
        <StyledText className="min-w-12 text-sm" bold>
          {formattedValue}
        </StyledText>
      </View>
      <RNSlider
        value={props.value}
        minimumValue={props.min}
        maximumValue={props.max}
        onValueChange={async ([newPos]) => await props.onChange(newPos!)}
        minimumTrackTintColor={`${Colors.red}33`} // 20% Opacity
        maximumTrackTintColor={surface}
        thumbStyle={{
          height: 64,
          width: props.value === props.min || props.value === props.max ? 0 : 2,
          backgroundColor: Colors.red,
        }}
        trackStyle={{ height: 64 }}
        // The slider height defaults to 40px and isn't inferred from the heights assigned.
        containerStyle={{ height: 64 }}
      />
      {width !== undefined ? <NSliderMarks width={width} {...props} /> : null}
    </View>
  );
}

type NMarkProps = {
  value: number;
  min: number;
  max: number;
  trackMarks?: number[];
  onChange: (value: number) => void | Promise<void>;
  formatValue: (value: number) => string;
};

function NSliderMarks(props: NMarkProps & { width: number }) {
  if (!props.trackMarks) return null;
  return props.trackMarks.map((val) => (
    <Pressable
      key={val}
      accessibilityLabel={props.formatValue(val)}
      hitSlop={{ left: 16, right: 16, top: 24, bottom: 24 }}
      onPress={() => props.onChange(val)}
      disabled={props.value === val}
      pointerEvents={props.value === val ? "none" : "auto"}
      style={{
        left: ((val - props.min) / (props.max - props.min)) * props.width,
      }}
      className={cn(
        "absolute top-1/2 h-4 w-0.5 -translate-x-px -translate-y-1/2",
        { "bg-foreground/5": val !== props.min && val !== props.max },
      )}
    />
  ));
}
//#endregion
