import { forwardRef } from "react";
import type { PressableProps, View } from "react-native";
import { Pressable } from "react-native";

import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";

/** Styled `<Pressable />` that populates the `android_ripple` property. */
export const StyledPressable = forwardRef<
  View,
  PressableProps & { forIcon?: boolean }
>(function StyledPressable(
  { android_ripple, className, forIcon, ...props },
  ref,
) {
  const { surface } = useTheme();
  return (
    <Pressable
      ref={ref}
      android_ripple={{
        color: surface,
        ...(forIcon ? { radius: 18 } : {}),
        ...android_ripple,
      }}
      // We expect icons to be `24px`; `p-3` will give the `<Pressable />`
      // a `48px` size.
      className={cn({ "p-3": forIcon }, className)}
      {...props}
    />
  );
});
