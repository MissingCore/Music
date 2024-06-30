import Ionicons from "@expo/vector-icons/Ionicons";

import { Colors } from "@/constants/Styles";
import { ActionButton } from "./action-button";

export namespace CheckboxField {
  export interface Props {
    checked: boolean;
    onPress: () => void;
    textContent: ActionButton.Props["textContent"];
  }
}

/** @description Controlled checkbox field built from `<ActionButton />`. */
export function CheckboxField({ checked, ...props }: CheckboxField.Props) {
  return (
    <ActionButton
      {...props}
      icon={{
        Element: (
          <Ionicons
            name={checked ? "checkmark-circle" : "ellipse-outline"}
            size={24}
            color={Colors.foreground50}
          />
        ),
      }}
      className="active:bg-surface700"
    />
  );
}
