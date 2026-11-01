// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { View } from "react-native";

import { cn, cva } from "~/lib/style";
import { Icon } from "../base/icon";
import { Ripple } from "../base/ripple";
import { baseContainerStyle } from "../base/styles";
import { TText } from "../base/typography";

//#region Base
function Checkbox({ checked, size = 20 }: { checked: boolean; size?: number }) {
  return (
    <View
      style={{ height: size, width: size }}
      className={cn(
        "items-center justify-center rounded-sm border border-onSurface",
        { "bg-onSurface": checked },
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

function CheckboxFieldBase(
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
        "flex-row items-center gap-4 px-2 disabled:opacity-25",
        props.className,
      )}
    >
      {props.children}
    </Ripple>
  );
}
//#endregion

//#region Field
export function CheckboxField(
  props: CheckboxFieldBaseProps & { children: React.ReactNode },
) {
  return (
    <CheckboxFieldBase
      {...props}
      className={cn("min-h-12 justify-between rounded-lg", props.className)}
    >
      <Checkbox checked={props.checked} />
      {props.children}
    </CheckboxFieldBase>
  );
}
//#endregion

//#region Clickwrap
const clickwrapCheckboxStyle = cva({
  composes: [baseContainerStyle],
  base: "min-h-6 gap-3 rounded-lg p-3",
  defaultVariants: { outline: true },
});

export function ClickwrapCheckbox(
  props: CheckboxFieldBaseProps & { textKey: ParseKeys },
) {
  return (
    <CheckboxFieldBase
      {...props}
      className={clickwrapCheckboxStyle({ className: props.className })}
    >
      <Checkbox checked={props.checked} />
      <TText textKey={props.textKey} size="sm" className="shrink grow" />
    </CheckboxFieldBase>
  );
}
//#endregion
