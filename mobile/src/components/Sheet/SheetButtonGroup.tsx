import { View } from "react-native";

import { cn } from "~/lib/style";
import type { ExtendTButtonProps } from "../Form/Button";
import { ExtendedTButton } from "../Form/Button";

export function SheetButtonGroup(props: {
  leftButton: ExtendTButtonProps;
  rightButton: ExtendTButtonProps;
  className?: string;
}) {
  return (
    <View className={cn("flex-row gap-0.75", props.className)}>
      <ExtendedTButton
        {...props.leftButton}
        className={cn("flex-1 rounded-r-xs", props.leftButton.className)}
      />
      <ExtendedTButton
        {...props.rightButton}
        className={cn("flex-1 rounded-l-xs", props.rightButton.className)}
      />
    </View>
  );
}
