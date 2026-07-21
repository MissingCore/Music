// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import type { SupportedIconName } from "~/resources/icons";
import { Icon } from "~/resources/icons";

import { CachedSlider } from "./Slider";
import { Em } from "../Typography/StyledText";

//#region Labeled Slider
interface LabeledSliderProps extends Omit<
  React.ComponentProps<typeof CachedSlider>,
  "_className"
> {
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
