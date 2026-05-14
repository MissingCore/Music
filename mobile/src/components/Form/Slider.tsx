import type { ParseKeys } from "i18next";
import type { Dispatch, SetStateAction } from "react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { LayoutChangeEvent, ViewStyle } from "react-native";
import { I18nManager, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  clamp,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { Icon } from "~/resources/icons/type";

import { Colors } from "~/constants/Styles";
import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import type { AppColor } from "~/modules/customization/theme/constants";
import { useColor } from "~/modules/customization/theme/hooks";
import { Em } from "../Typography/StyledText";

/**
 * Reanimated slider whose render value is handled internally and is
 * instantiated on mount.
 */
export const CachedSlider = memo(function CachedSlider(props: {
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
  vertical?: boolean;
  /** Invert appearance & functionality given `I18nManager` is enabled.  */
  inverted?: boolean;
  thickness?: number;
  /**
   * Hitslop applied to sides where `thickness` applies. Will change the
   * component's height (width if `vertical = true`).
   */
  hitSlop?: number;
  /** If the slider should be transparent. */
  transparent?: boolean;
  trackColor?: AppColor;
  progressColor?: AppColor;
  /** If the progress indicator will have a rounded end stop. */
  roundedEndStop?: boolean;
  /**
   * Optionally display an overlay on top of the slider. Should be used
   * with tall sliders.
   */
  overlay?: SliderOverlayProps;
  /** How much we should debounce calling `onChange` based on `step`. Defaults to `5`. */
  _debounceMultiplier?: number;
  /** Add additional styles to the slider wrapper. */
  _className?: string;
}) {
  const onVertical = useMemo(
    () =>
      <T, U>(valIfTrue: T, valIfFalse: U) =>
        props.vertical ? valIfTrue : valIfFalse,
    [props.vertical],
  );
  const onVerticalWorklet = useMemo(
    () =>
      <T, U>(valIfTrue: T, valIfFalse: U) => {
        "worklet";
        return props.vertical ? valIfTrue : valIfFalse;
      },
    [props.vertical],
  );

  const currVal = useSharedValue(props.initValue);
  const moveableDistance = props.max - props.min;
  const step = useRef(props.step ?? 1);
  const debounceMultiplier = useRef(props._debounceMultiplier ?? 5);

  const anchorPoint = props.anchorAt ?? props.min;
  const distFromMin = anchorPoint - props.min;
  const distFromMax = props.max - anchorPoint;
  const anchorDistFromMin = onVertical(distFromMax, distFromMin);
  const anchorDistFromMax = onVertical(distFromMin, distFromMax);

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
      sliderLength.value = e.nativeEvent.layout[onVertical("height", "width")];
    },
    [onVertical, sliderLength],
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
      const i18nAdjustedL =
        I18nManager.isRTL && !props.inverted && !props.vertical
          ? sliderLength.value - l
          : l;
      const clampedValue = clamp(0, i18nAdjustedL, sliderLength.value);
      let progressPrecent = clampedValue / sliderLength.value;
      if (props.vertical) progressPrecent = 1 - progressPrecent;
      const rawVal = progressPrecent * moveableDistance + props.min;
      // Round based on the step.
      return roundToStep(rawVal, step.current);
    },
    [sliderLength, moveableDistance, props.min, props.vertical, props.inverted],
  );
  //#endregion

  //#region Gestures
  const tapGesure = useMemo(
    () =>
      Gesture.Tap()
        .enabled(!props.disabled)
        .onBegin(() => setIsInteracting(true))
        .onEnd(({ x, y }) => {
          const finalizedValue = calculateNextValue(onVerticalWorklet(y, x));
          setCurrVal(finalizedValue);
          setIsInteracting(false);
          if (onCompleteRef.current)
            scheduleOnRN(onCompleteRef.current, finalizedValue);
        }),
    [
      onVerticalWorklet,
      calculateNextValue,
      setIsInteracting,
      setCurrVal,
      props.disabled,
    ],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!props.disabled)
        .onBegin(() => setIsInteracting(true))
        .onStart(({ x, y }) => {
          debounceFrom.value = onVerticalWorklet(y, x);
        })
        .onUpdate(({ x, y, velocityX, velocityY }) => {
          const nextValue = calculateNextValue(onVerticalWorklet(y, x));
          setCurrVal(nextValue);
          debouncedOnChange(nextValue, onVerticalWorklet(velocityY, velocityX));
        })
        .onEnd(({ x, y }) => {
          const finalizedValue = calculateNextValue(onVerticalWorklet(y, x));
          setCurrVal(finalizedValue);
          if (onCompleteRef.current)
            scheduleOnRN(onCompleteRef.current, finalizedValue);
        })
        .onFinalize(() => setIsInteracting(false)),
    [
      onVerticalWorklet,
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
  const shouldInvertStyle =
    I18nManager.isRTL && props.inverted && !props.vertical;

  const StyleKey = useMemo(
    () =>
      ({
        shortSide: onVertical("width", "height"),
        longSide: onVertical("height", "width"),
        // Apply padding against the "long" sides.
        paddingBlock: onVertical("paddingHorizontal", "paddingVertical"),
        minEndCap: onVertical(
          "rounded-t-full",
          shouldInvertStyle ? "rounded-r-full" : "rounded-l-full",
        ),
        maxEndCap: onVertical(
          "rounded-b-full",
          shouldInvertStyle ? "rounded-l-full" : "rounded-r-full",
        ),
      }) as const,
    [onVertical, shouldInvertStyle],
  );

  const progressColor = useColor(props.progressColor, "primary");
  const trackColor = useColor(props.trackColor, "surfaceContainerLowest");

  const hitSlopViewStyle: ViewStyle = useMemo(
    () => ({ [StyleKey.paddingBlock]: props.hitSlop ?? 0 }),
    [StyleKey, props.hitSlop],
  );

  const sliderWrapperStyle: ViewStyle = useMemo(
    () => ({
      backgroundColor: props.transparent ? Colors.transparent : trackColor,
      [StyleKey.shortSide]: props.thickness ?? 12,
    }),
    [StyleKey, trackColor, props.thickness, props.transparent],
  );

  // Section that goes to min.
  const toMinProgressWrapperStyle = useAnimatedStyle(() => ({
    [StyleKey.longSide]: anchorDistFromMin * containerRatio.value,
  }));

  const toMinProgressStyle = useAnimatedStyle(() => ({
    backgroundColor: props.transparent ? Colors.transparent : progressColor,
    [StyleKey.longSide]: (anchorPoint - currVal.value) * containerRatio.value,
    opacity: currVal.value > anchorPoint ? 0 : 1,
  }));

  // Section that goes to max.
  const toMaxProgressWrapperStyle = useAnimatedStyle(() => ({
    [StyleKey.longSide]: anchorDistFromMax * containerRatio.value,
  }));

  const toMaxProgressStyle = useAnimatedStyle(() => ({
    backgroundColor: props.transparent ? Colors.transparent : progressColor,
    [StyleKey.longSide]: (currVal.value - anchorPoint) * containerRatio.value,
    opacity: currVal.value < anchorPoint ? 0 : 1,
  }));
  //#endregion

  return (
    <GestureDetector gesture={gestures}>
      <View style={hitSlopViewStyle} className={props._className}>
        <View
          onLayout={onLayout}
          style={sliderWrapperStyle}
          className={cn(
            "relative overflow-hidden rounded-full",
            onVertical("h-full flex-col", "w-full flex-row"),
            { "flex-row-reverse": shouldInvertStyle },
          )}
        >
          {props.overlay && !props.vertical ? (
            <SliderOverlay
              {...props.overlay}
              value={currVal}
              inverted={shouldInvertStyle}
            />
          ) : null}

          <Animated.View
            style={toMinProgressWrapperStyle}
            className={cn("justify-end", {
              "items-end": !props.vertical,
              "flex-row-reverse": shouldInvertStyle,
            })}
          >
            <Animated.View
              style={onVertical(toMaxProgressStyle, toMinProgressStyle)}
              className={cn("h-full", {
                [StyleKey.minEndCap]: props.roundedEndStop,
              })}
            />
          </Animated.View>
          <Animated.View
            style={toMaxProgressWrapperStyle}
            className={cn({ "flex-row-reverse": shouldInvertStyle })}
          >
            <Animated.View
              style={onVertical(toMinProgressStyle, toMaxProgressStyle)}
              className={cn("h-full", {
                [StyleKey.maxEndCap]: props.roundedEndStop,
              })}
            />
          </Animated.View>

          {anchorPoint !== props.min && (
            <View
              style={{
                [onVertical("top", "left")]:
                  `${((shouldInvertStyle ? anchorDistFromMax : anchorDistFromMin) / moveableDistance) * 100}%`,
                backgroundColor: props.transparent
                  ? Colors.transparent
                  : progressColor,
                transform: [
                  onVertical(
                    { translateY: "-50%" },
                    { translateX: OnRTL.decide("50%", "-50%") },
                  ),
                ],
              }}
              className={cn(
                "absolute aspect-square rounded-full",
                onVertical("w-full", "h-full"),
              )}
            />
          )}
        </View>
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

const SliderOverlay = memo(function SliderOverlay(
  props: SliderOverlayProps & {
    value: SharedValue<number>;
    inverted?: boolean;
  },
) {
  const { t } = useTranslation();
  const [currentValue, setCurrentValue] = useState(() => props.value.value);

  useAnimatedReaction(
    () => props.value.value,
    (currVal) => scheduleOnRN(setCurrentValue, currVal),
  );

  const formattedValue = props.formatValue(currentValue);

  return (
    <View
      accessible
      accessibilityLabel={`${t(props.accessibilityLabelKey)}: ${formattedValue}`}
      pointerEvents="none"
      className={cn(
        "absolute top-1/2 z-10 w-full -translate-y-1/2 flex-row items-center justify-center gap-1",
        { "flex-row-reverse": props.inverted },
      )}
    >
      <props.Icon size={20} />
      <Em className={cn("min-w-10 text-sm", { "text-right": props.inverted })}>
        {formattedValue}
      </Em>
    </View>
  );
});
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
