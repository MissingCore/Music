import { Text, View } from "react-native";

import { cn } from "~/lib/style";

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
      <Text
        style={{ fontSize: 8 }}
        className="text-roboto text-center leading-tight text-foreground"
      >
        {props.text}
      </Text>
    </View>
  );
}
