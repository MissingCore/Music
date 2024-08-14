import { useBottomSheet } from "@gorhom/bottom-sheet";
import { Link } from "expo-router";
import { forwardRef } from "react";
import type { PressableProps } from "react-native";
import { Pressable, Text, View } from "react-native";

import type { MaterialSymbolNames } from "@/resources/icons";
import { MaterialSymbols } from "@/resources/icons";

export namespace Button {
  type Interactions =
    | { interaction?: "button"; href?: never }
    | { interaction: "link"; href: string };

  export type Props = Interactions & {
    icon: MaterialSymbolNames;
    content: string;
    dontCloseOnPress?: boolean;
    onPress?: PressableProps["onPress"];
  };
}

/**
 * Button modeled after iOS "Activity views" buttons. Closes the modal
 * it's in when pressed (unless `dontCloseOnPress` is provided). Must be
 * used inside a `<BottomSheet />`.
 */
export function Button({
  interaction = "button",
  href,
  ...props
}: Button.Props) {
  if (interaction === "button") return <ButtonBase {...props} />;
  return (
    <Link href={href!} asChild>
      <ButtonBase {...props} />
    </Link>
  );
}

export const ButtonBase = forwardRef<View, Button.Props>(
  function ButtonBase(props, ref) {
    const { close } = useBottomSheet();

    return (
      <Pressable
        ref={ref}
        onPress={(e) => {
          if (props.onPress) props.onPress(e);
          if (!props.dontCloseOnPress) close();
        }}
        className="w-24 items-center active:opacity-75"
      >
        <View className="mb-2 size-20 items-center justify-center rounded-lg bg-surface700">
          <MaterialSymbols name={props.icon} size={48} />
        </View>
        <Text
          numberOfLines={2}
          className="h-[30px] text-center align-middle font-geistMono text-xs text-foreground50"
        >
          {props.content}
        </Text>
      </Pressable>
    );
  },
);
