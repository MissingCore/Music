import { View } from "react-native";

import { cn } from "~/lib/style";
import { Marquee } from "../Containment/Marquee";
import { StyledText } from "../Typography/StyledText";

/** Header component to be used in `<Sheet />`. */
export function SheetHeader(props: {
  getHeight?: (height: number) => void;
  title?: string;
}) {
  return (
    <View
      onLayout={(e) => {
        if (props.getHeight) props.getHeight(e.nativeEvent.layout.height);
      }}
      className={cn("gap-2 px-4 pb-2", { "pb-6": !!props.title })}
    >
      <View className="mx-auto my-[10px] h-1 w-8 rounded-full bg-onSurface" />
      {props.title ? (
        <Marquee center>
          <StyledText className="text-lg">{props.title}</StyledText>
        </Marquee>
      ) : null}
    </View>
  );
}
