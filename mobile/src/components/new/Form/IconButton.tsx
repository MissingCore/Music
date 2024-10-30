import type { StyleProp, ViewStyle } from "react-native";
import { Pressable } from "react-native";

import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";

type OptionalIconButtonProps =
  | { kind?: "default" | "ripple"; accessibilityLabel: string }
  | { kind: "extended"; accessibilityLabel?: string };

/** Button specifically built for icons. */
export function IconButton({
  kind = "default",
  ...props
}: OptionalIconButtonProps & {
  children: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  /** Radius of ripple if we don't use a standard `24px` icon. */
  rippleRadius?: number;
  /** Styles applied to the `<Pressable />` wrapping the `children`. */
  style?: StyleProp<ViewStyle>;
  /** Classnames applied to the `<Pressable />` wrapping the `children`. */
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
