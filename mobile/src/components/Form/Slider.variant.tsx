// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { memo, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nManager, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { useAnimatedReaction, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { SupportedIconName } from "~/resources/icons";
import { Icon } from "~/resources/icons";

import { cn } from "~/lib/style";
import { CachedSlider } from "./Slider";
import { Em } from "../Typography/StyledText";

type SliderProps = React.ComponentProps<typeof CachedSlider>;

//#region Labeled Slider
interface LabeledSliderProps extends Omit<SliderProps, "_className"> {
  displayedValue: string;
  /** Optional icon that appears before the `displayedValue`. */
  icon?: SupportedIconName;
}

/** Slider which displays an optional icon followed by the value. */
export function LabeledSlider({
  displayedValue,
  icon,
  ...props
}: LabeledSliderProps) {
  return (
    <View className="flex-row items-center gap-2">
      <CachedSlider
        hitSlop={10}
        trackColor="surfaceContainer"
        roundedEndStop
        _debounceMultiplier={1}
        _className="shrink grow"
        {...props}
      />
      <View className="w-14 flex-row items-center justify-center gap-2">
        {icon ? <Icon name={icon} size={20} /> : null}
        <Em style={{ fontVariant: ["tabular-nums"] }}>{displayedValue}</Em>
      </View>
    </View>
  );
}
//#endregion

//#region Nothing Slider
interface NothingSliderProps extends Omit<
  SliderProps,
  "liveValue" | "vertical"
> {
  overlay: SliderOverlayProps;
}

export function NothingSlider({
  overlay,
  thickness = 48,
  ...props
}: NothingSliderProps) {
  const liveValue = useSharedValue(props.initValue);
  return (
    <View className="relative">
      <CachedSlider {...props} liveValue={liveValue} thickness={thickness} />
      <SliderOverlay
        {...overlay}
        value={liveValue}
        inverted={I18nManager.isRTL && props.inverted}
      />
    </View>
  );
}

type SliderOverlayProps = {
  accessibilityLabelKey: ParseKeys;
  icon: SupportedIconName;
  formatValue: (val: number) => string;
};

const SliderOverlay = memo(function SliderOverlay(
  props: SliderOverlayProps & {
    value: SharedValue<number>;
    inverted?: boolean;
  },
) {
  const { t } = useTranslation();
  const [currentValue, setCurrentValue] = useState(() => props.value.get());

  useAnimatedReaction(
    () => props.value.get(),
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
      <Icon name={props.icon} size={20} />
      <Em className={cn("min-w-10 text-sm", { "text-right": props.inverted })}>
        {formattedValue}
      </Em>
    </View>
  );
});
//#endregion
