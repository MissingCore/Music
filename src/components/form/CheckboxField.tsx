import Ionicons from "@expo/vector-icons/Ionicons";

import { Colors } from "@/constants/Styles";
import type { ActionButtonProps } from "./ActionButton";
import { ActionButton } from "./ActionButton";

export type CheckboxFieldProps = {
  checked: boolean;
  onPress: () => void;
  textContent: ActionButtonProps["textContent"];
};

/** @description Controlled checkbox field built from `<ActionButton />`. */
export function CheckboxField(props: CheckboxFieldProps) {
  return (
    <ActionButton
      onPress={props.onPress}
      textContent={props.textContent}
      Icon={
        <Ionicons
          name={props.checked ? "checkmark-circle" : "ellipse-outline"}
          size={24}
          color={Colors.foreground50}
        />
      }
      className="active:bg-surface700"
    />
  );
}
