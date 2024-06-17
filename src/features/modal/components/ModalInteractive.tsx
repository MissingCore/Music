import { useBottomSheet } from "@gorhom/bottom-sheet";
import { Link as ExpoLink } from "expo-router";
import { forwardRef } from "react";
import type { GestureResponderEvent } from "react-native";
import { Pressable, Text, View } from "react-native";

import * as MaterialSymbol from "@/assets/svgs/MaterialSymbol";

const Icons = { ...MaterialSymbol };

type ModalButtonProps = {
  icon: keyof typeof Icons;
  content: string;
  dontCloseOnPress?: boolean;
  onPress?: (e: GestureResponderEvent) => void;
};

/**
 * @description Button modeled after iOS "Activity views" buttons. Closes
 *  the modal it's in when pressed (unless `dontCloseOnPress` is provided).
 *  Must be used inside a `<BottomSheet />`.
 */
export const Button = forwardRef<View, ModalButtonProps>(
  function Button(props, ref) {
    const { close } = useBottomSheet();

    const Icon = Icons[props.icon];

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
          <Icon size={48} />
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

interface ModalLinkProps extends React.ComponentProps<typeof Button> {
  href: string;
}

/** @description A `<Link />` for a modal. */
export function Link({ href, ...rest }: ModalLinkProps) {
  return (
    <ExpoLink href={href} asChild>
      <Button {...rest} />
    </ExpoLink>
  );
}
