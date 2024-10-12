import type { VariantProps } from "cva";
import { cva } from "cva";
import { forwardRef } from "react";
import type { PressableProps } from "react-native";
import { Pressable, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";

type RippleStyleProps = VariantProps<typeof rippleStyles>;
const rippleStyles = cva({
  base: ["min-h-12 justify-center p-4"],
  variants: {
    preset: {
      default: "",
      /*
        Expected for icons to be `24px` in size; `p-3` gets to the
        recommended `48px` tap target.
      */
      icon: "p-3",
      select: "disabled:bg-surface",
    },
  },
  compoundVariants: [
    {
      preset: ["default", "icon"],
      class: "active:opacity-75 disabled:opacity-25",
    },
  ],
  defaultVariants: { preset: "default" },
});

interface RippleProps extends PressableProps, RippleStyleProps {
  /** Style the `<View />` wrapper. */
  wrapperClassName?: string;
}

/** Styled `<Pressable />` that populates the `android_ripple` property. */
export const Ripple = forwardRef<View, RippleProps>(function Ripple(
  { android_ripple, className, wrapperClassName, preset, ...props },
  ref,
) {
  const { surface } = useTheme();
  return (
    <View
      className={cn(
        "overflow-hidden",
        { "rounded-md": preset === "select" },
        wrapperClassName,
      )}
    >
      <Pressable
        ref={ref}
        android_ripple={{
          color: surface,
          ...(preset === "icon" ? { radius: 18 } : {}),
          ...android_ripple,
        }}
        className={cn(rippleStyles({ preset }), className)}
        {...props}
      />
    </View>
  );
});
