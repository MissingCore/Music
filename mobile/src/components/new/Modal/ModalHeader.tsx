import { View } from "react-native";

import { cn } from "@/lib/style";
import { StyledText } from "../Typography";

/** Header component to be used in `<ModalSheet />`. */
export function ModalHeader({
  title,
  noBg,
  noPadding,
}: {
  title: string;
  noBg?: boolean;
  noPadding?: boolean;
}) {
  return (
    <View
      className={cn({
        "bg-canvas dark:bg-neutral5": !noBg,
        "pb-4": !noPadding,
      })}
    >
      {title ? (
        <StyledText center className="text-lg">
          {title}
        </StyledText>
      ) : null}
    </View>
  );
}
