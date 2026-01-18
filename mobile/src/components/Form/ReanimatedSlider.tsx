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
  /** Helper to prevent dragging when used inside a sheet. */
  dragPrevention?: Dispatch<SetStateAction<boolean>>;
  /** Function call is debounced, which is based on `5 * step`. */
  onChange: (value: number) => void | Promise<void>;
  /** Fallsback to `onChange`. */
  onComplete?: (value: number) => void | Promise<void>;
  /** Defaults to `1`. */
  step?: number;
  /** Invert appearance & functionality given `I18nManager` is enabled.  */
  inverted?: boolean;
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
  /** Add additional styles to the slider wrapper. */
  _className?: string;
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
  const setDraggableRef = useRef(props.dragPrevention);
  const onChangeRef = useRef(props.onChange);
  const onCompleteRef = useRef(props.onComplete ?? props.onChange);

  const debounceFrom = useSharedValue(0);
  const debouncedOnChange = useCallback(
    (value: number, velocity: number) => {
      "worklet";
      // If velocity is greater than 500 (ie: abnormal use), don't do anything.
      if (Math.abs(velocity) > 500) return;
      // Don't immediately call `onChange` if we haven't moved 5 steps.
      if (Math.abs(debounceFrom.value - value) < step.current * 5) return;
      debounceFrom.value = value;
      scheduleOnRN(onChangeRef.current, value);
    },
    [debounceFrom],
  );

  const setDraggable = useCallback((draggable: boolean) => {
    "worklet";
    if (setDraggableRef.current)
      scheduleOnRN(setDraggableRef.current, draggable);
  }, []);

  const calculateNextValue = useCallback(
    (x: number) => {
      "worklet";
      const i18nAdjustedX =
        I18nManager.isRTL && !props.inverted ? sliderWidth.value - x : x;
      const clampedValue = clamp(0, i18nAdjustedX, sliderWidth.value);
      const progressPrecent = clampedValue / sliderWidth.value;
      const rawVal = progressPrecent * moveableDistance.current + props.min;
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
        .onStart(() => {
          setDraggable(false);
        })
        .onEnd(({ x }) => {
          setDraggable(true);
          const finalizedValue = calculateNextValue(x);
          currVal.value = finalizedValue;
          scheduleOnRN(onCompleteRef.current, finalizedValue);
        }),
    [calculateNextValue, setDraggable, currVal],
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(({ x }) => {
          setDraggable(false);
          debounceFrom.value = x;
        })
        .onUpdate(({ x, velocityX }) => {
          const nextValue = calculateNextValue(x);
          currVal.value = nextValue;
          debouncedOnChange(nextValue, velocityX);
        })
        .onEnd(({ x }) => {
          setDraggable(true);
          const finalizedValue = calculateNextValue(x);
          currVal.value = finalizedValue;
          scheduleOnRN(onCompleteRef.current, finalizedValue);
        }),
    [
      calculateNextValue,
      setDraggable,
      currVal,
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
      <props.Icon size={16} />
      <StyledText
        bold
        className={cn("min-w-8 text-xs", { "text-right": props.inverted })}
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
