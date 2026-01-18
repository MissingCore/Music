import { memo, useCallback, useMemo, useRef } from "react";
import type { LayoutChangeEvent, ViewStyle } from "react-native";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useColor } from "~/hooks/useTheme";

import type { ColorRole } from "~/lib/style";
import { cn } from "~/lib/style";

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
        className="w-full overflow-hidden rounded-full"
      >
        <Animated.View style={progressStyle} className={progressClassName} />
      </View>
    </GestureDetector>
  );
});

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
