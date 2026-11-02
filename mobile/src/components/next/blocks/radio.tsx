// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { cn } from "~/lib/style";
import { Ripple } from "../base/ripple";

//#region Base
function Radio({ selected, size = 20 }: { selected: boolean; size?: number }) {
  return (
    <View
      style={{ height: size, width: size }}
      className={cn(
        "items-center justify-center rounded-full border border-onSurface",
        { "border-5": selected },
      )}
    />
  );
}

type RadioFieldBaseProps = {
  selected: boolean;
  onSelect: VoidFunction;
  disabled?: boolean;
  className?: string;
};

function RadioFieldBase(
  props: RadioFieldBaseProps & { children: React.ReactNode },
) {
  return (
    <Ripple
      role="radio"
      aria-checked={props.selected}
      aria-disabled={props.disabled}
      onPress={props.onSelect}
      disabled={props.disabled || props.selected}
      className={cn("flex-row items-center gap-4 px-2", props.className)}
    >
      {props.children}
    </Ripple>
  );
}
//#endregion

//#region Field
export function RadioField(
  props: RadioFieldBaseProps & { children: React.ReactNode },
) {
  return (
    <RadioFieldBase
      {...props}
      className={cn("min-h-12 justify-between rounded-lg", props.className)}
    >
      <Radio selected={props.selected} />
      {props.children}
    </RadioFieldBase>
  );
}
//#endregion
