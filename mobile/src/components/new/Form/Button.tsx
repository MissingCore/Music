import type { VariantProps } from "cva";
import { cva } from "cva";
import type { PressableProps } from "react-native";
import { Pressable } from "react-native";

import { cn } from "@/lib/style";

export type ButtonStyleProps = VariantProps<typeof buttonStyles>;
export const buttonStyles = cva({
  base: [
    "min-h-12 flex-1 items-center justify-center gap-2 border p-2",
    "transition-opacity active:opacity-75 disabled:opacity-25",
  ],
  variants: {
    preset: {
      default: "bg-surface border-surface",
      danger: "bg-red border-red",
      outline: "border-foreground",
    },
    pill: { true: "rounded-full", false: "rounded-md" },
  },
  defaultVariants: { preset: "default", pill: false },
});

/** Styled `<Pressable />`. */
export function Button({
  className,
  preset,
  pill,
  ...rest
}: PressableProps & ButtonStyleProps) {
  return (
    <Pressable
      className={cn(buttonStyles({ preset, pill }), className)}
      {...rest}
    />
  );
}
