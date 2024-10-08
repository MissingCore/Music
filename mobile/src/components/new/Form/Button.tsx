import type { VariantProps } from "cva";
import { cva } from "cva";
import type { PressableProps } from "react-native";
import { Pressable, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";

export type ButtonStyleProps = VariantProps<typeof buttonStyles>;
export const buttonStyles = cva({
  base: ["min-h-12 justify-center"],
  variants: {
    preset: {
      default: "border-surface bg-surface",
      danger: "border-red bg-red",
      warning: "border-yellow bg-yellow",
      outline: "border-foreground",
      plain: "border-transparent",
      ripple: "border-transparent disabled:border-surface disabled:bg-surface",
    },
    pill: { true: "rounded-full", false: "rounded-md" },
    icon: { true: "min-w-12 p-3", false: "gap-2 border p-4" },
  },
  compoundVariants: [
    // The opacity styles shouldn't be applied for `preset="ripple"`.
    {
      preset: ["default", "danger", "warning", "outline", "plain"],
      class: "active:opacity-75 disabled:opacity-25",
    },
    { preset: "outline", pill: true, icon: false, class: "px-4" },
  ],
  defaultVariants: { preset: "default", pill: false, icon: false },
});

/** Styled `<Pressable />`. */
export function Button({
  className,
  wrapperClassName,
  preset,
  pill,
  icon,
  ...rest
}: PressableProps &
  ButtonStyleProps & {
    /** Style the `<View />` wrapper when using `preset="ripple"`. */
    wrapperClassName?: string;
  }) {
  const { surface } = useTheme();

  if (preset !== "ripple") {
    return (
      <Pressable
        className={cn(buttonStyles({ preset, pill, icon }), className)}
        {...rest}
      />
    );
  }

  return (
    <View className={cn("overflow-hidden rounded-md", wrapperClassName)}>
      <Pressable
        android_ripple={{ color: surface }}
        className={cn(buttonStyles({ preset, pill, icon }), className)}
        {...rest}
      />
    </View>
  );
}
