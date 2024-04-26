import { useBottomSheet } from "@gorhom/bottom-sheet";
import { forwardRef } from "react";
import { Pressable, Text, View } from "react-native";

import { cn } from "@/lib/style";

type ModalFormButtonProps = {
  disabled?: boolean;
  content: string;
  onPress?: () => void;
  className?: string;
  textClassName?: string;
};

/** @description A form button used in a modal. */
export const ModalFormButton = forwardRef<View, ModalFormButtonProps>(
  (props, ref) => {
    const { close } = useBottomSheet();

    return (
      <Pressable
        ref={ref}
        onPress={() => {
          if (!props.disabled) {
            if (props.onPress) props.onPress();
            close();
          }
        }}
        className={cn(
          "items-center rounded-full border border-surface500 px-4 py-1.5",
          { "border-foreground50 active:bg-surface700": !props.disabled },
          props.className,
        )}
      >
        <Text
          className={cn(
            "font-geistMono text-sm text-surface500",
            { "text-foreground50": !props.disabled },
            props.textClassName,
          )}
        >
          {props.content}
        </Text>
      </Pressable>
    );
  },
);
