import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { Pressable, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";

export const PressPropsKeys = [
  ...["disabled", "delayLongPress", "onLongPress", "onPress", "onPressOut"],
] as const;

/** The most "used" action props used on `<Pressable />`. */
export type PressProps = Pick<PressableProps, (typeof PressPropsKeys)[number]>;

//#region Button
/** Styled button meeting the recommened touch target size. */
export function Button({ className, ...props }: PressableProps) {
  return (
    <Pressable
      className={cn(
        "min-h-12 items-center justify-center gap-2 rounded-md bg-surface p-4",
        "active:opacity-75 disabled:opacity-25",
        className,
      )}
      {...props}
    />
  );
}
//#endregion

//#region Icon Button
type ConditionalIconButtonProps =
  | { kind?: "default" | "ripple"; accessibilityLabel: string }
  | { kind: "extended"; accessibilityLabel?: string };

/** Button specifically built for icons. */
export function IconButton({
  kind = "default",
  accessibilityLabel,
  rippleRadius,
  className,
  ...pressableProps
}: ConditionalIconButtonProps &
  PressProps & {
    children: React.ReactNode;
    /** Radius of ripple if we don't use a standard `24px` icon. */
    rippleRadius?: number;
    style?: StyleProp<ViewStyle>;
    className?: string;
  }) {
  const { onSurface } = useTheme();
  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      android_ripple={
        kind === "ripple"
          ? { color: onSurface, radius: rippleRadius ?? 18 }
          : undefined
      }
      className={cn(
        "min-h-12 min-w-12 items-center justify-center p-3 disabled:opacity-25",
        {
          "rounded-md bg-surface active:opacity-75": kind !== "ripple",
          "flex-row justify-start gap-2": kind === "extended",
        },
        className,
      )}
      {...pressableProps}
    />
  );
}
//#endregion

//#region Ripple Button
/** Button styled using `android_ripple` for press animations. */
export function Ripple({
  wrapperStyle,
  wrapperClassName,
  className,
  ...pressableProps
}: PressProps & {
  children: React.ReactNode;
  /** Styles applied to the `<View />` wrapping the `<Pressable />`. */
  wrapperStyle?: StyleProp<ViewStyle>;
  /** Classnames applied to the `<View />` wrapping the `<Pressable />`. */
  wrapperClassName?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
}) {
  const { surface } = useTheme();
  return (
    <View
      style={wrapperStyle}
      className={cn("overflow-hidden rounded-sm", wrapperClassName)}
    >
      <Pressable
        android_ripple={{ color: surface }}
        className={cn("min-h-12 flex-row items-center gap-2", className)}
        {...pressableProps}
      />
    </View>
  );
}
//#endregion
