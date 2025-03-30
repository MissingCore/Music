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
      containerStyle={{ height: props.thumbSize + 16 }}
    />
  );
}
//#endregion

//#region Nothing Slider
/** Custom slider design to match the one in the Nothing X app. */
export function NSlider(
  props: NMarkProps & {
    label: string;
    icon: React.ReactNode;
    formatValue: (value: number) => string;
    step?: number;
  },
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
        <StyledText className="h-4 min-w-12 py-0.5 text-sm/none" bold>
          {formattedValue}
        </StyledText>
      </View>
      <RNSlider
        value={props.value}
        minimumValue={props.min}
        maximumValue={props.max}
        step={props.step}
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
};

const markClass =
  "absolute top-1/2 h-4 w-0.5 -translate-x-1/2 -translate-y-1/2";

function NSliderMarks({ min, max, ...rest }: NMarkProps & { width: number }) {
  if (!rest.trackMarks) return null;
  return rest.trackMarks.map((val) =>
    val !== min && val !== max ? (
      <View
        key={val}
        pointerEvents="none"
        style={{ left: ((val - min) / (max - min)) * rest.width }}
        className={cn("bg-foreground/5", markClass)}
      />
    ) : (
      <Pressable
        key={val}
        accessible={false}
        hitSlop={{ left: 16, right: 16, top: 24, bottom: 24 }}
        onPress={() => rest.onChange(val)}
        disabled={rest.value === val}
        pointerEvents={rest.value === val ? "none" : "auto"}
        style={{ left: ((val - min) / (max - min)) * rest.width }}
        className={markClass}
      />
    ),
  );
}
//#endregion
