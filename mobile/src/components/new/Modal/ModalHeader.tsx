import { View } from "react-native";

import { cn } from "@/lib/style";
import { StyledText } from "../Typography";

/** Header component to be used in `<ModalSheet />`. */
export function ModalHeader({
  title,
  noPadding,
}: {
  title: string;
  noPadding?: boolean;
}) {
  return (
    <View className={cn("bg-canvas dark:bg-neutral5", { "pb-4": !noPadding })}>
      {title ? (
        <StyledText className="text-center text-lg">{title}</StyledText>
      ) : null}
    </View>
  );
}
