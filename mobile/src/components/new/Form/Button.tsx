import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { Pressable, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";

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
  ...props
}: ConditionalIconButtonProps & {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  /** Radius of ripple if we don't use a standard `24px` icon. */
  rippleRadius?: number;
  style?: StyleProp<ViewStyle>;
  className?: string;
}) {
  const { onSurface } = useTheme();
  return (
    <Pressable
      accessibilityLabel={props.accessibilityLabel}
      android_ripple={
        kind === "ripple"
          ? { color: onSurface, radius: props.rippleRadius ?? 18 }
          : undefined
      }
      onPress={props.onPress}
      disabled={props.disabled}
      style={props.style}
      className={cn(
        "min-h-12 min-w-12 items-center justify-center p-3 disabled:opacity-25",
        {
          "rounded-md bg-surface active:opacity-75": kind !== "ripple",
          "flex-row justify-start gap-2": kind === "extended",
        },
        props.className,
      )}
    >
      {props.children}
    </Pressable>
  );
}
//#endregion

//#region Ripple Button
/** Button styled using `android_ripple` for press animations. */
export function Ripple(props: {
  children: React.ReactNode;
  onPress: () => void;
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
      style={props.wrapperStyle}
      className={cn("overflow-hidden rounded-sm", props.wrapperClassName)}
    >
      <Pressable
        android_ripple={{ color: surface }}
        onPress={props.onPress}
        style={props.style}
        className={cn("min-h-12 flex-row items-center gap-2", props.className)}
      >
        {props.children}
      </Pressable>
    </View>
  );
}
//#endregion
