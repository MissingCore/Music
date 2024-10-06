import { View } from "react-native";

import { StyledText } from "../Typography";

/** Header component to be used in `<ModalSheet />`. */
export function ModalHeader({ title }: { title: string }) {
  return (
    <View className="bg-canvas pb-4 dark:bg-neutral5">
      {title ? (
        <StyledText className="text-center text-lg">{title}</StyledText>
      ) : null}
    </View>
  );
}
