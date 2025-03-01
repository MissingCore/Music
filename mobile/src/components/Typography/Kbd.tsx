import { View } from "react-native";

import { cn } from "~/lib/style";
import { StyledText } from "./StyledText";

/** Our version of the HTML keyboard input element. */
export function Kbd(props: { text: string; className?: string }) {
  return (
    <View
      aria-hidden
      className={cn(
        "size-[14px] items-center justify-center rounded-sm bg-onSurface",
        props.className,
      )}
    >
      <StyledText style={{ fontSize: 8 }} className="text-center leading-tight">
        {props.text}
      </StyledText>
    </View>
  );
}
