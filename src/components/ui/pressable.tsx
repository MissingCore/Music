import { forwardRef } from "react";
import type { PressableProps, View } from "react-native";
import { Platform, Pressable } from "react-native";

import { Colors } from "@/constants/Styles";
import { cn } from "@/lib/style";

// eslint-disable-next-line import/export
export namespace StyledPressable {
  export type Props = PressableProps & {
    forIcon?: boolean;
  };
}

/** @description Pre-styled `<Pressable />` with `android_ripple`. */
// eslint-disable-next-line @typescript-eslint/no-redeclare, import/export
export const StyledPressable = forwardRef<View, StyledPressable.Props>(
  function StyledPressable(
    { forIcon, android_ripple, className, ...props },
    ref,
  ) {
    return (
      <Pressable
        ref={ref}
        {...props}
        android_ripple={{
          color: Colors.surface700,
          // Radius is 75% (ie: 18px for 24px icon).
          ...(forIcon ? { radius: 18 } : {}),
          ...android_ripple,
        }}
        className={cn(
          {
            // Icons are generally 24px; adding `p-3` of padding will give
            // it the 48px size.
            "p-3": forIcon,
            "active:opacity-75": Platform.OS !== "android",
          },
          className,
        )}
      />
    );
  },
);
