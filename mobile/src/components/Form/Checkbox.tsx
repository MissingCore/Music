import type { ParseKeys } from "i18next";
import { memo } from "react";
import { Pressable, View } from "react-native";

import { Check } from "~/resources/icons/Check";

import { cn } from "~/lib/style";
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
      {checked ? <Check size={size} color="surface" /> : null}
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
export const CheckboxField = memo(function CheckboxField({
  children,
  ...props
}: CheckboxFieldBaseProps & { children?: React.ReactNode }) {
  return (
    <CheckboxFieldBase
      {...props}
      className={cn("min-h-12 justify-between gap-4 px-2", props.className)}
    >
      {children}
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
