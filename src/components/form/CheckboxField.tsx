import Ionicons from "@expo/vector-icons/Ionicons";

import { Colors } from "@/constants/Styles";
import { ActionButton } from "./ActionButton";

export type CheckboxFieldProps = {
  checked: boolean;
  onPress: () => void;
  textContent: React.ComponentProps<typeof ActionButton>["textContent"];
};

/** @description Custom checkbox field for our use case. */
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
