import type { ParseKeys } from "i18next";
import type { Dispatch, SetStateAction } from "react";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { LayoutChangeEvent, ViewStyle } from "react-native";
import { I18nManager, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  clamp,
  useAnimatedStyle,
  useDerivedValue,
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
  initValue: number;
  liveValue?: SharedValue<number>;
  min: number;
  max: number;
  /** Notify the parent if the slider recognized interactions. */
  getInteractionStatus?: Dispatch<SetStateAction<boolean>>;
  /** Function call is debounced, which is based on `_debounceMultiplier * step`. */
  onChange?: (value: number) => void | Promise<void>;
  /** Fallsback to `onChange` as `onChange` might not get the final value due to the debounce logic. */
  onComplete?: (value: number) => void | Promise<void>;
  /** Defaults to `1`. */
  step?: number;
  /** Invert appearance & functionality given `I18nManager` is enabled.  */
  inverted?: boolean;
  height?: number;
  /** Vertical hitslop. Will change the component's height. */
  vHitSlop?: number;
  trackColor?: ColorRole;
  progressColor?: ColorRole;
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
  const currVal = useSharedValue(props.initValue);
  const moveableDistance = useMemo(
    () => props.max - props.min,
    [props.min, props.max],
  );
  const step = useRef(props.step ?? 1);
  const debounceMultiplier = useRef(props._debounceMultiplier ?? 5);

  //#region Synchronization
  const setCurrVal = useCallback(
    (val: number) => {
      "worklet";
      currVal.value = val;
      if (props.liveValue !== undefined) props.liveValue.value = val;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.liveValue],
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
  const sliderWidth = useSharedValue(0);
  const onLayout = useCallback(
    (e: LayoutChangeEvent) => {
      sliderWidth.value = e.nativeEvent.layout.width;
    },
    [sliderWidth],
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
    (x: number) => {
      "worklet";
      const i18nAdjustedX =
        I18nManager.isRTL && !props.inverted ? sliderWidth.value - x : x;
      const clampedValue = clamp(0, i18nAdjustedX, sliderWidth.value);
      const progressPrecent = clampedValue / sliderWidth.value;
      const rawVal = progressPrecent * moveableDistance + props.min;
      // Round based on the step.
      return roundToStep(rawVal, step.current);
    },
    [sliderWidth, moveableDistance, props.min, props.inverted],
  );
  //#endregion

  //#region Gestures
  const tapGesure = useMemo(
    () =>
      Gesture.Tap()
        .onBegin(() => setIsInteracting(true))
        .onEnd(({ x }) => {
          const finalizedValue = calculateNextValue(x);
          setCurrVal(finalizedValue);
          setIsInteracting(false);
          if (onCompleteRef.current)
            scheduleOnRN(onCompleteRef.current, finalizedValue);
        }),
    [calculateNextValue, setIsInteracting, setCurrVal],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onBegin(() => setIsInteracting(true))
        .onStart(({ x }) => {
          debounceFrom.value = x;
        })
        .onUpdate(({ x, velocityX }) => {
          const nextValue = calculateNextValue(x);
          setCurrVal(nextValue);
          debouncedOnChange(nextValue, velocityX);
        })
        .onEnd(({ x }) => {
          const finalizedValue = calculateNextValue(x);
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

  const shouldInvertStyle = useMemo(
    () => I18nManager.isRTL && props.inverted,
    [props.inverted],
  );

  const hitSlopViewStyle: ViewStyle = useMemo(
    () => ({ paddingVertical: props.vHitSlop ?? 0 }),
    [props.vHitSlop],
  );

  const sliderWrapperStyle: ViewStyle = useMemo(
    () => ({ backgroundColor: trackColor, height: props.height ?? 12 }),
    [trackColor, props.height],
  );
  const sliderWrappeClassName = useMemo(
    () =>
      cn(
        "relative w-full overflow-hidden rounded-full",
        { "flex-row-reverse": shouldInvertStyle },
        props._className,
      ),
    [shouldInvertStyle, props._className],
  );

  const progressStyle = useAnimatedStyle(() => ({
    backgroundColor: progressColor,
    width: ((currVal.value - props.min) / moveableDistance) * sliderWidth.value,
  }));

  const progressClassName = useMemo(
    () => cn("h-full", { "rounded-r-full": props.roundedEndStop }),
    [props.roundedEndStop],
  );
  //#endregion

  return (
    <GestureDetector gesture={gestures}>
      <View style={hitSlopViewStyle}>
        <View
          onLayout={onLayout}
          style={sliderWrapperStyle}
          className={sliderWrappeClassName}
        >
          {props.overlay ? (
            <SliderOverlay
              {...props.overlay}
              value={currVal}
              inverted={shouldInvertStyle}
            />
          ) : null}
          <Animated.View style={progressStyle} className={progressClassName} />
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

const LISTENER_ID = 987654321;

const SliderOverlay = memo(function SliderOverlay(
  props: SliderOverlayProps & {
    value: SharedValue<number>;
    inverted?: boolean;
  },
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
      className={cn(
        "absolute top-1/2 z-10 w-full -translate-y-1/2 flex-row items-center justify-center gap-1",
        { "flex-row-reverse": props.inverted },
      )}
    >
      <props.Icon size={20} />
      <StyledText
        bold
        className={cn("min-w-10 text-sm", { "text-right": props.inverted })}
      >
        {formattedValue}
      </StyledText>
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
