import type { ParseKeys } from "i18next";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { LayoutChangeEvent, ViewStyle } from "react-native";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN, scheduleOnUI } from "react-native-worklets";

import type { Icon } from "~/resources/icons/type";
import { useColor } from "~/hooks/useTheme";

import type { ColorRole } from "~/lib/style";
import { cn } from "~/lib/style";
import { StyledText } from "../Typography/StyledText";

/**
 * Reanimated slider whose render value is handled internally and is
 * instantiated on mount.
 */
export const CachedSlider = memo(function CachedSlider(props: {
  initVal: number;
  min: number;
  max: number;
  onChange?: (value: number) => void | Promise<void>;
  /** Fallsback to `onChange` for Tap gesture. */
  onComplete?: (value: number) => void | Promise<void>;
  step?: number;
  height?: number;
  trackColor?: ColorRole;
  progressColor?: ColorRole;
  /** If the progress indicator will have a rounded end stop. */
  roundedEndStop?: boolean;
  /**
   * Optionally display an overlay on top of the slider. Should be used
   * with tall sliders.
   */
  overlay?: SliderOverlayProps;
}) {
  const currVal = useSharedValue(props.initVal);
  const moveableDistance = useRef(props.max - props.min);
  const step = useRef(props.step ?? 1);

  //#region Layout Context
  const sliderWidth = useSharedValue(0);
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      sliderWidth.value = e.nativeEvent.layout.width;
    },
    [sliderWidth],
  );
  //#endregion

  //#region Handlers
  const onChangeRef = useRef(props.onChange);
  const onCompleteRef = useRef(props.onComplete);

  const calculateNextValue = useCallback(
    (x: number) => {
      "worklet";
      const clampedValue = clamp(0, x, sliderWidth.value);
      const progressPrecent = clampedValue / sliderWidth.value;
      const rawVal = progressPrecent * moveableDistance.current + props.min;
      // Round based on the step.
      return roundToStep(rawVal, step.current);
    },
    [sliderWidth, moveableDistance, props.min],
  );
  //#endregion

  //#region Gestures
  const tapGesure = useMemo(
    () =>
      Gesture.Tap().onEnd(({ x }) => {
        const finalizedValue = calculateNextValue(x);
        currVal.value = finalizedValue;
        if (onCompleteRef.current) {
          scheduleOnRN(onCompleteRef.current, finalizedValue);
        } else if (onChangeRef.current) {
          // Use this handler if it exists instead.
          scheduleOnRN(onChangeRef.current, finalizedValue);
        }
      }),
    [calculateNextValue, currVal],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate(({ x }) => {
          const nextValue = calculateNextValue(x);
          currVal.value = nextValue;
          if (onChangeRef.current) scheduleOnRN(onChangeRef.current, nextValue);
        })
        .onEnd(({ x }) => {
          const finalizedValue = calculateNextValue(x);
          currVal.value = finalizedValue;
          if (onCompleteRef.current)
            scheduleOnRN(onCompleteRef.current, finalizedValue);
        }),
    [calculateNextValue, currVal],
  );

  const gestures = useMemo(
    () => Gesture.Race(tapGesure, panGesture),
    [tapGesure, panGesture],
  );
  //#endregion

  //#region Styling
  const progressColor = useColor(props.progressColor, "primary");
  const trackColor = useColor(props.trackColor, "surfaceContainerLowest");

  const sliderWrapperStyle: ViewStyle = useMemo(
    () => ({ backgroundColor: trackColor, height: props.height ?? 12 }),
    [trackColor, props.height],
  );

  const progressStyle = useAnimatedStyle(() => ({
    backgroundColor: progressColor,
    width:
      ((currVal.value - props.min) / moveableDistance.current) *
      sliderWidth.value,
  }));

  const progressClassName = useMemo(
    () => cn("h-full", { "rounded-r-full": props.roundedEndStop }),
    [props.roundedEndStop],
  );
  //#endregion

  return (
    <GestureDetector gesture={gestures}>
      <View
        onLayout={onLayout}
        style={sliderWrapperStyle}
        className="relative w-full overflow-hidden rounded-full"
      >
        {props.overlay ? (
          <SliderOverlay {...props.overlay} value={currVal} />
        ) : null}
        <Animated.View style={progressStyle} className={progressClassName} />
      </View>
    </GestureDetector>
  );
});

//#region Overlay
type SliderOverlayProps = {
  accessibilityLabelKey: ParseKeys;
  Icon: (props: Icon) => React.ReactNode;
  formatValue: (val: number) => string;
};

const LISTENER_ID = 987654321;

function SliderOverlay(
  props: SliderOverlayProps & { value: SharedValue<number> },
) {
  const { t } = useTranslation();
  const [currentValue, setCurrentValue] = useState(() => props.value.value);

  useEffect(() => {
    scheduleOnUI(() =>
      props.value.addListener(LISTENER_ID, (value) =>
        scheduleOnRN(setCurrentValue, value),
      ),
    );
    return () => {
      scheduleOnUI(() => props.value.removeListener(LISTENER_ID));
    };
  }, [props.value]);

  const formattedValue = props.formatValue(currentValue);

  return (
    <View
      accessible
      accessibilityLabel={`${t(props.accessibilityLabelKey)}: ${formattedValue}`}
      pointerEvents="none"
      className="absolute top-1/2 z-10 w-full -translate-y-1/2 flex-row items-center justify-center gap-1"
    >
      <props.Icon size={16} />
      <StyledText className="min-w-8 text-xs" bold>
        {formattedValue}
      </StyledText>
    </View>
  );
}
//#endregion

//#region Utils
/** Round number to nearest step. */
function roundToStep(rawNum: number, step: number) {
  "worklet";
  const roundedVal = Math.round(rawNum / step) * step;

  // Figure out number of decimal places we round to.
  let decimalPlaces = 0;
  const stepStr = step.toString();
  const decimalIndex = stepStr.indexOf(".");
  if (decimalIndex !== -1) decimalPlaces = stepStr.length - decimalIndex - 1;

  if (decimalPlaces === 0) return roundedVal;
  return parseFloat(roundedVal.toFixed(decimalPlaces));
}
//#endregion
