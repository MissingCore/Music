import { memo } from "react";
import { Pressable, View } from "react-native";

import { Check } from "~/resources/icons/Check";

import { cn } from "~/lib/style";

//#region Base
function Radio({ selected }: { selected: boolean }) {
  return (
    <View
      className={cn(
        "size-5 items-center justify-center rounded-full border border-foreground",
        { "border-0 bg-foreground": selected },
      )}
    >
      {selected ? <Check size={18} color="surface" /> : null}
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
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: props.selected }}
      onPress={props.onSelect}
      // `<Radio />` utilizes the `disabled` prop to prevent togglability.
      disabled={props.selected}
      className={cn(
        "min-h-12 flex-row items-center justify-between gap-4 px-2 active:opacity-50",
        props.className,
      )}
    >
      {props.children}
      <Radio selected={props.selected} />
    </Pressable>
  );
});
//#endregion
