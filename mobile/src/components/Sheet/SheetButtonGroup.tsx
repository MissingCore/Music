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
    <View className={cn("flex-row gap-[3px]", props.className)}>
      <Button
        {...props.leftButton}
        className={cn("rounded-r-xs flex-1", props.leftButton.className)}
      >
        <TStyledText
          textKey={props.leftButton.textKey}
          className="text-center text-sm"
          bold
        />
      </Button>
      <Button
        {...props.rightButton}
        className={cn("rounded-l-xs flex-1", props.rightButton.className)}
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
