// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import React, { memo } from "react";
import { View } from "react-native";

import { Icon } from "~/resources/icons";

import { cn } from "~/lib/style";
import { Pressable, Ripple } from "../Base/Pressable";
import { TStyledText } from "../Typography/StyledText";

//#region Base
function Checkbox({ checked, size = 20 }: { checked: boolean; size?: number }) {
  return (
    <View
      style={{ height: size, width: size }}
      className={cn(
        "items-center justify-center rounded-xs border border-onSurface",
        { "border-0 bg-onSurface": checked },
      )}
    >
      {checked ? <Icon name="check" size={size} color="surface" /> : null}
    </View>
  );
}

type CheckboxFieldBaseProps = {
  accessibilityLabel?: string;
  checked: boolean;
  onCheck: VoidFunction;
  disabled?: boolean;
  className?: string;
};

const CheckboxFieldBase = memo(function CheckboxFieldBase(
  props: CheckboxFieldBaseProps & { children: React.ReactNode },
) {
  return (
    <Pressable
      accessibilityLabel={props.accessibilityLabel}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: props.checked, disabled: props.disabled }}
      onPress={props.onCheck}
      disabled={props.disabled}
      className={cn(
        "flex-row items-center gap-2 active:opacity-50 disabled:opacity-25",
        props.className,
      )}
    >
      {props.children}
    </Pressable>
  );
});
//#endregion

//#region Field
export const CheckboxField = memo(function CheckboxField(
  props: CheckboxFieldBaseProps & { children: React.ReactNode },
) {
  return (
    <Ripple
      accessibilityLabel={props.accessibilityLabel}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: props.checked, disabled: props.disabled }}
      onPress={props.onCheck}
      disabled={props.disabled}
      className={cn(
        "min-h-12 flex-row items-center justify-between gap-4 rounded-md px-2",
        props.className,
      )}
    >
      {props.children}
      <Checkbox checked={props.checked} />
    </Ripple>
  );
});
//#endregion

//#region Checkbox Input
export const CheckboxInput = memo(function CheckboxInput(
  props: CheckboxFieldBaseProps & { accessibilityLabel: string },
) {
  return (
    <CheckboxFieldBase
      {...props}
      className={cn("min-h-12 px-2", props.className)}
    >
      <Checkbox checked={props.checked} />
    </CheckboxFieldBase>
  );
});
//#endregion

//region Clickwrap
/** More traditional checkbox field appearance. */
export const ClickwrapCheckbox = memo(function ClickwrapCheckbox(
  props: CheckboxFieldBaseProps & { textKey: ParseKeys },
) {
  return (
    <CheckboxFieldBase {...props} className={cn("min-h-6", props.className)}>
      <Checkbox checked={props.checked} size={16} />
      <TStyledText textKey={props.textKey} className="shrink grow text-sm" />
    </CheckboxFieldBase>
  );
});
//#endregion
