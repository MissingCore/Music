import { forwardRef } from "react";
import type { GestureResponderEvent, View } from "react-native";
import { Pressable, Text } from "react-native";

import { cn } from "@/lib/style";

const ButtonThemes = {
  default: {
    button: {
      base: "border-foreground50 active:bg-surface700",
      disabled: "border-surface500",
    },
    text: { base: "text-foreground50", disabled: "text-surface500" },
  },
  secondary: {
    button: {
      base: "border-surface500 bg-surface500 active:border-surface700 active:bg-surface700",
      disabled: "border-surface700 bg-surface700",
    },
    text: { base: "text-foreground50", disabled: "text-surface500" },
  },
  pop: {
    button: {
      base: "border-accent500 bg-accent500 active:border-accent50 active:bg-accent50",
      disabled: "border-surface700 bg-surface700",
    },
    text: { base: "text-foreground50", disabled: "text-surface500" },
  },
} as const;

export type ButtonProps = {
  theme?: keyof typeof ButtonThemes;
  disabled?: boolean;
  content: string;
  onPress?: (e?: GestureResponderEvent) => void;
  className?: string;
};

/** @description Custom pill button.. */
export const Button = forwardRef<View, ButtonProps>((props, ref) => {
  const theme = props.theme ?? "default";

  return (
    <Pressable
      ref={ref}
      onPress={(e) => {
        if (!props.disabled && props.onPress) props.onPress(e);
      }}
      className={cn(
        "items-center rounded-full border px-4 py-1.5",
        {
          [ButtonThemes[theme].button.base]: !props.disabled,
          [ButtonThemes[theme].button.disabled]: props.disabled,
        },
        props.className,
      )}
    >
      <Text
        className={cn("font-geistMono text-sm", {
          [ButtonThemes[theme].text.base]: !props.disabled,
          [ButtonThemes[theme].text.disabled]: props.disabled,
        })}
      >
        {props.content}
      </Text>
    </Pressable>
  );
});
