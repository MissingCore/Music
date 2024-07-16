import { Ionicons } from "../icons";

import { ActionButton } from "./action-button";

export namespace CheckboxField {
  export interface Props {
    checked: boolean;
    onPress: () => void;
    textContent: ActionButton.Props["textContent"];
  }
}

/** Controlled checkbox field built from `<ActionButton />`. */
export function CheckboxField({ checked, ...props }: CheckboxField.Props) {
  return (
    <ActionButton
      {...props}
      icon={{
        Element: (
          <Ionicons name={checked ? "checkmark-circle" : "ellipse-outline"} />
        ),
      }}
    />
  );
}
