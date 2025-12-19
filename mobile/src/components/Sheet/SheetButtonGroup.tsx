import type { ParseKeys } from "i18next";
import type { PressableProps } from "react-native";
import { View } from "react-native";

import { cn } from "~/lib/style";
import { Button } from "../Form/Button";
import { TStyledText } from "../Typography/StyledText";

type ButtonOptions = Omit<PressableProps, "children"> & { textKey: ParseKeys };

export function SheetButtonGroup(props: {
  leftButton: ButtonOptions;
  rightButton: ButtonOptions;
  className?: string;
}) {
  return (
    <View className={cn("flex-row gap-0.75", props.className)}>
      <Button
        {...props.leftButton}
        className={cn(
          "min-h-14 flex-1 rounded-r-xs",
          props.leftButton.className,
        )}
      >
        <TStyledText
          textKey={props.leftButton.textKey}
          className="text-center text-sm"
          bold
        />
      </Button>
      <Button
        {...props.rightButton}
        className={cn(
          "min-h-14 flex-1 rounded-l-xs",
          props.rightButton.className,
        )}
      >
        <TStyledText
          textKey={props.rightButton.textKey}
          className="text-center text-sm"
          bold
        />
      </Button>
    </View>
  );
}
