// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { Fragment, memo, useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import { Icon } from "~/resources/icons";

import { cn } from "~/lib/style";
import { Button } from "./Button";
import { Ripple } from "../Base/Pressable";
import { TStyledText } from "../Typography/StyledText";

//#region Base
export function Radio(props: {
  selected: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={props.style}
      className={cn(
        "size-5 items-center justify-center rounded-full border border-onSurface",
        { "border-0 bg-onSurface": props.selected },
        props.className,
      )}
    >
      {props.selected ? <Icon name="check" size={18} color="surface" /> : null}
    </View>
  );
}
//#endregion

//#region Field
type RadioFieldProps = {
  children: React.ReactNode;
  selected: boolean;
  onSelect: VoidFunction;
  className?: string;
};

export const RadioField = memo(function RadioField(props: RadioFieldProps) {
  return (
    <Ripple
      accessibilityRole="radio"
      accessibilityState={{ selected: props.selected }}
      onPress={props.onSelect}
      // `<Radio />` utilizes the `disabled` prop to prevent togglability.
      disabled={props.selected}
      className={cn("flex-row justify-between gap-4 px-2", props.className)}
    >
      {props.children}
      <Radio selected={props.selected} />
    </Ripple>
  );
});
//#endregion

//#region Chip
function RadioChipField(props: {
  labelKey?: ParseKeys;
  children: React.ReactNode;
}) {
  const Wrapper = useMemo(
    () => (props.labelKey ? View : Fragment),
    [props.labelKey],
  );
  return (
    <Wrapper>
      {props.labelKey ? (
        <TStyledText textKey={props.labelKey} className="mb-2" />
      ) : null}
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        {props.children}
      </View>
    </Wrapper>
  );
}

function RadioChipFieldItem(
  props: Omit<RadioFieldProps, "children"> & {
    labelKey: ParseKeys;
    disabled?: boolean;
  },
) {
  return (
    <Button
      accessibilityRole="radio"
      accessibilityState={{ selected: props.selected }}
      onPress={props.onSelect}
      disabled={props.disabled || props.selected}
      className={cn(
        "min-h-auto rounded-full bg-surfaceContainerLow py-2 disabled:opacity-100",
        { "bg-primary": props.selected },
      )}
    >
      <TStyledText
        textKey={props.labelKey}
        className={cn("text-xs", { "text-onPrimary": props.selected })}
      />
    </Button>
  );
}

RadioChipField.Item = memo(RadioChipFieldItem);

export { RadioChipField };
//#endregion
