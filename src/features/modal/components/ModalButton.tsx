import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { forwardRef } from "react";
import type { GestureResponderEvent } from "react-native";
import { Pressable, Text, View } from "react-native";

import Colors from "@/constants/Colors";

type IconVariants =
  | { type: "feather"; name: React.ComponentProps<typeof Feather>["name"] }
  | { type: "ionicons"; name: React.ComponentProps<typeof Ionicons>["name"] };

type ModalButtonProps = {
  icon: IconVariants;
  content: string;
  onClose: (() => void) | undefined;
  onPress?: (e: GestureResponderEvent) => void;
};

/** @description Wraps an icon & text with a `<Pressable />` for a modal. */
export const ModalButton = forwardRef<View, ModalButtonProps>((props, ref) => {
  const sharedProps = { size: 24, color: Colors.foreground50 };

  return (
    <Pressable
      ref={ref}
      onPress={(e) => {
        if (props.onPress) props.onPress(e);
        if (props.onClose) props.onClose();
      }}
      className="flex-row items-center gap-4 p-2"
    >
      {props.icon.type === "feather" ? (
        <Feather name={props.icon.name} {...sharedProps} />
      ) : (
        <Ionicons name={props.icon.name} {...sharedProps} />
      )}
      <Text className="font-geistMono text-lg text-foreground50">
        {props.content}
      </Text>
    </Pressable>
  );
});
