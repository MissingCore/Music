import type { Dispatch, SetStateAction } from "react";
import { memo, useCallback, useMemo, useRef } from "react";
import type { LayoutChangeEvent, ViewStyle } from "react-native";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  clamp,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { useColor } from "~/hooks/useTheme";

import { Colors } from "~/constants/Styles";
import type { AppColor } from "~/lib/style";
import { cn } from "~/lib/style";

/**
 * Reanimated slider whose render value is handled internally and is
 * instantiated on mount.
 */
export const CachedSliderVertical = memo(function CachedSliderVertical(props: {
  initValue: number;
  liveValue?: SharedValue<number>;
  min: number;
  max: number;
  /** Value where the progress bar moves from. Defaults to `min`. */
  anchorAt?: number;
  disabled?: boolean;
  /** Notify the parent if the slider recognized interactions. */
  getInteractionStatus?: Dispatch<SetStateAction<boolean>>;
  /** Function call is debounced, which is based on `_debounceMultiplier * step`. */
  onChange?: (value: number) => void | Promise<void>;
  /** Fallsback to `onChange` as `onChange` might not get the final value due to the debounce logic. */
  onComplete?: (value: number) => void | Promise<void>;
  /** Defaults to `1`. */
  step?: number;
  thickness?: number;
  /** Horizontal hitslop. Will change the component's width. */
  hHitSlop?: number;
  /** If the slider should be transparent. */
  transparent?: boolean;
  trackColor?: AppColor;
  progressColor?: AppColor;
  /** If the progress indicator will have a rounded end stop. */
  roundedEndStop?: boolean;
  /** How much we should debounce calling `onChange` based on `step`. Defaults to `5`. */
  _debounceMultiplier?: number;
  /** Add additional styles to the slider wrapper. */
  _className?: string;
}) {
  const currVal = useSharedValue(props.initValue);
  const moveableDistance = props.max - props.min;
  const step = useRef(props.step ?? 1);
  const debounceMultiplier = useRef(props._debounceMultiplier ?? 5);

  const anchorPoint = props.anchorAt ?? props.max;
  const anchorDistFromMin = anchorPoint - props.min;
  const anchorDistFromMax = props.max - anchorPoint;

  //#region Synchronization
  const setCurrVal = useCallback(
    (val: number) => {
      "worklet";
      currVal.value = val;
      if (props.liveValue !== undefined) props.liveValue.value = val;
    },
    [currVal, props.liveValue],
  );

  //? Synchronize internal value with external value.
  useDerivedValue(() => {
    if (props.liveValue === undefined) return;
    if (props.liveValue.value === currVal.value) return;
    //? If values are different, it means `liveValue` was changed.
    currVal.value = props.liveValue.value;
  });
  //#endregion

  //#region Layout Context
  const sliderLength = useSharedValue(0);
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      sliderLength.value = e.nativeEvent.layout.height;
    },
    [sliderLength],
  );

  const containerRatio = useDerivedValue(
    () => sliderLength.value / moveableDistance,
  );
  //#endregion

  //#region Handlers
  const setIsInteractingRef = useRef(props.getInteractionStatus);
  const onChangeRef = useRef(props.onChange);
  const onCompleteRef = useRef(props.onComplete ?? props.onChange);

  const debounceFrom = useSharedValue(0);
  const debouncedOnChange = useCallback(
    (value: number, velocity: number) => {
      "worklet";
      // If velocity is greater than 500 (ie: abnormal use), don't do anything.
      if (Math.abs(velocity) > 500) return;
      // Don't immediately call `onChange` if we haven't moved `debounceMultipler * step`.
      if (
        Math.abs(debounceFrom.value - value) <
        step.current * debounceMultiplier.current
      ) {
        return;
      }
      debounceFrom.value = value;
      if (onChangeRef.current) scheduleOnRN(onChangeRef.current, value);
    },
    [debounceFrom],
  );

  const setIsInteracting = useCallback((isInteracted: boolean) => {
    "worklet";
    if (setIsInteractingRef.current)
      scheduleOnRN(setIsInteractingRef.current, isInteracted);
  }, []);

  const calculateNextValue = useCallback(
    (l: number) => {
      "worklet";
      const clampedValue = clamp(0, l, sliderLength.value);
      const progressPrecent = 1 - clampedValue / sliderLength.value;
      const rawVal = progressPrecent * moveableDistance + props.min;
      // Round based on the step.
      return roundToStep(rawVal, step.current);
    },
    [sliderLength, moveableDistance, props.min],
  );
  //#endregion

  //#region Gestures
  const tapGesure = useMemo(
    () =>
      Gesture.Tap()
        .enabled(!props.disabled)
        .onBegin(() => setIsInteracting(true))
        .onEnd(({ y }) => {
          const finalizedValue = calculateNextValue(y);
          setCurrVal(finalizedValue);
          setIsInteracting(false);
          if (onCompleteRef.current)
            scheduleOnRN(onCompleteRef.current, finalizedValue);
        }),
    [calculateNextValue, setIsInteracting, setCurrVal, props.disabled],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!props.disabled)
        .onBegin(() => setIsInteracting(true))
        .onStart(({ y }) => {
          debounceFrom.value = y;
        })
        .onUpdate(({ y, velocityY }) => {
          const nextValue = calculateNextValue(y);
          setCurrVal(nextValue);
          debouncedOnChange(nextValue, velocityY);
        })
        .onEnd(({ y }) => {
          const finalizedValue = calculateNextValue(y);
          setCurrVal(finalizedValue);
          if (onCompleteRef.current)
            scheduleOnRN(onCompleteRef.current, finalizedValue);
        })
        .onFinalize(() => setIsInteracting(false)),
    [
      calculateNextValue,
      setIsInteracting,
      setCurrVal,
      debounceFrom,
      debouncedOnChange,
      props.disabled,
    ],
  );

  const gestures = useMemo(
    () => Gesture.Race(tapGesure, panGesture),
    [tapGesure, panGesture],
  );
  //#endregion

  //#region Styling
  const progressColor = useColor(props.progressColor, "primary");
  const trackColor = useColor(props.trackColor, "surfaceContainerLowest");

  const hitSlopViewStyle: ViewStyle = useMemo(
    () => ({ paddingHorizontal: props.hHitSlop ?? 0 }),
    [props.hHitSlop],
  );

  const sliderWrapperStyle: ViewStyle = useMemo(
    () => ({
      backgroundColor: props.transparent ? Colors.transparent : trackColor,
      width: props.thickness ?? 12,
    }),
    [trackColor, props.thickness, props.transparent],
  );

  const leftProgressWrapperStyle = useAnimatedStyle(() => ({
    height: anchorDistFromMax * containerRatio.value,
  }));

  const leftProgressStyle = useAnimatedStyle(() => ({
    backgroundColor: props.transparent ? Colors.transparent : progressColor,
    height: (currVal.value - anchorPoint) * containerRatio.value,
    opacity: currVal.value < anchorPoint ? 0 : 1,
  }));

  const rightProgressWrapperStyle = useAnimatedStyle(() => ({
    height: anchorDistFromMin * containerRatio.value,
  }));

  const rightProgressStyle = useAnimatedStyle(() => ({
    backgroundColor: props.transparent ? Colors.transparent : progressColor,
    height: (anchorPoint - currVal.value) * containerRatio.value,
    opacity: currVal.value > anchorPoint ? 0 : 1,
  }));
  //#endregion

  return (
    <GestureDetector gesture={gestures}>
      <View style={hitSlopViewStyle} className={props._className}>
        <View
          onLayout={onLayout}
          style={sliderWrapperStyle}
          className="relative h-full overflow-hidden rounded-full"
        >
          <Animated.View
            style={leftProgressWrapperStyle}
            className="items-end justify-end"
          >
            <Animated.View
              style={leftProgressStyle}
              className={cn("w-full", {
                "rounded-t-full": props.roundedEndStop,
              })}
            />
          </Animated.View>
          <Animated.View style={rightProgressWrapperStyle}>
            <Animated.View
              style={rightProgressStyle}
              className={cn("h-full", {
                "rounded-b-full": props.roundedEndStop,
              })}
            />
          </Animated.View>

          {anchorPoint !== props.max && (
            <View
              style={{
                top: `${(anchorDistFromMax / moveableDistance) * 100}%`,
                backgroundColor: props.transparent
                  ? Colors.transparent
                  : progressColor,
              }}
              className="absolute aspect-square w-full -translate-y-1/2 rounded-full"
            />
          )}
        </View>
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
