// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { memo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import { Icon } from "~/resources/icons";

import { cn } from "~/lib/style";
import { Ripple } from "../Base/Pressable";

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
