import type { ParseKeys } from "i18next";
import type { PressableProps } from "react-native";
import { View } from "react-native";

import { cn } from "~/lib/style";
import { ExtendedTButton } from "../Form/Button";

type ButtonOptions = Omit<PressableProps, "children"> & { textKey: ParseKeys };

export function SheetButtonGroup(props: {
  leftButton: ButtonOptions;
  rightButton: ButtonOptions;
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
