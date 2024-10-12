import type { VariantProps } from "cva";
import { cva } from "cva";
import type { PressableProps } from "react-native";
import { Pressable } from "react-native";

import { cn } from "@/lib/style";

export type ButtonStyleProps = VariantProps<typeof buttonStyles>;
export const buttonStyles = cva({
  base: ["min-h-12 justify-center active:opacity-75 disabled:opacity-25"],
  variants: {
    preset: {
      default: "bg-surface",
      danger: "bg-red",
      warning: "bg-yellow",
      outline: "border border-foreground",
      plain: "",
    },
    pill: { true: "rounded-full", false: "rounded-md" },
    icon: { true: "min-w-12 p-3", false: "gap-2 p-4" },
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
  icon,
  ...rest
}: PressableProps & ButtonStyleProps) {
  return (
    <Pressable
      className={cn(buttonStyles({ preset, pill, icon }), className)}
      {...rest}
    />
  );
}
