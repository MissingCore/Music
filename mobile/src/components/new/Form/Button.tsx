import type { VariantProps } from "cva";
import { cva } from "cva";
import type { PressableProps } from "react-native";
import { Pressable } from "react-native";

import { cn } from "@/lib/style";

export type ButtonStyleProps = VariantProps<typeof buttonStyles>;
export const buttonStyles = cva({
  base: [
    "min-h-12 items-center justify-center",
    "transition-opacity active:opacity-75 disabled:opacity-25",
  ],
  variants: {
    preset: {
      default: "border-surface bg-surface",
      danger: "border-red bg-red",
      warning: "border-yellow bg-yellow",
      outline: "border-foreground",
      plain: "border-transparent",
    },
    pill: { true: "rounded-full", false: "rounded-md" },
    icon: { true: "min-w-12 p-3", false: "flex-1 gap-2 border p-2" },
  },
  compoundVariants: [
    { preset: "outline", pill: true, icon: false, class: "px-4" },
  ],
  defaultVariants: { preset: "default", pill: false, icon: false },
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
