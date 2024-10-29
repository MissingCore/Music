import { View } from "react-native";

import { Marquee } from "../Marquee";
import { StyledText } from "../Typography";

/** Header component to be used in `<Sheet />`. */
export function SheetHeader({ title }: { title?: string }) {
  return (
    <View className="pb-6">
      <View className="mx-auto my-[10px] h-1 w-1/12 min-w-6 rounded-full bg-onSurface" />
      {title ? (
        <Marquee center>
          <StyledText className="text-lg">{title}</StyledText>
        </Marquee>
      ) : null}
    </View>
  );
}
