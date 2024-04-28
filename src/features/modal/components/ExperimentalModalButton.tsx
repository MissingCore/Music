import { useBottomSheet } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import type { GestureResponderEvent, View } from "react-native";
import { Pressable } from "react-native";

import * as MaterialSymbol from "@/assets/svgs/MaterialSymbol";

import { TextLine } from "@/components/ui/Text";
import { cn } from "@/lib/style";

const Icons = { ...MaterialSymbol };

type ModalButtonProps = {
  icon: keyof typeof Icons;
  content: string;
  dontCloseOnPress?: boolean;
  onPress?: (e: GestureResponderEvent) => void;
};

/**
 * @description Wraps an icon & text with a `<Pressable />` for a modal.
 *  When pressed, will close the current modal (unless `dontCloseOnPress`
 *  is provided). Must be used inside a `<BottomSheet />`.
 */
export const ModalButton = forwardRef<View, ModalButtonProps>((props, ref) => {
  const { close } = useBottomSheet();

  const Icon = Icons[props.icon];

  return (
    <Pressable
      ref={ref}
      onPress={(e) => {
        if (props.onPress) props.onPress(e);
        if (!props.dontCloseOnPress) close();
      }}
      className={cn(
        "size-[108px] items-center justify-between px-1 pb-2 pt-4",
        "rounded-lg bg-surface700 active:bg-surface500",
      )}
    >
      <Icon size={42} />
      <TextLine
        numberOfLines={2}
        className="h-[30px] text-center align-middle font-geistMono text-xs text-foreground50"
      >
        {props.content}
      </TextLine>
    </Pressable>
  );
});
