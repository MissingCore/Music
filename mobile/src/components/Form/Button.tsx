import type { PressableProps, StyleProp, ViewStyle } from "react-native";
import { Pressable, View } from "react-native";

import type { Icon } from "~/resources/icons/type";
import { useTheme } from "~/hooks/useTheme";

import { Colors } from "~/constants/Styles";
import { cn } from "~/lib/style";

export const PressPropsKeys = [
  "disabled",
  "delayLongPress",
  "onLongPress",
  "onPress",
  "onPressOut",
] as const;

/** The most "used" action props used on `<Pressable />`. */
export type PressProps = Pick<PressableProps, (typeof PressPropsKeys)[number]>;

//#region Button
/** Styled button meeting the recommened touch target size. */
export function Button({ className, ...props }: PressableProps) {
  return (
    <Pressable
      className={cn(
        "min-h-12 min-w-12 items-center justify-center gap-2 rounded-md bg-surface p-4",
        "active:opacity-75 disabled:opacity-25",
        className,
      )}
      {...props}
    />
  );
}
//#endregion

//#region Icon Button
/** Icon with ripple effect. Automatically sized to `48px`. */
export function IconButton({
  Icon,
  large = false,
  active,
  filled,
  className,
  ...pressableProps
}: {
  Icon: (props: Icon) => React.JSX.Element;
  accessibilityLabel: string;
  onPress: PressableProps["onPress"];
  /** Scale the icon up to `32px`. */
  large?: boolean;
  /** Switches the icon color to red. */
  active?: boolean;
  /** Use the `filled` variant on the icon if available. */
  filled?: boolean;
  disabled?: PressableProps["disabled"];
  className?: string;
}) {
  const { onSurface } = useTheme();
  const iconColor = active ? Colors.red : undefined;
  return (
    <Pressable
      android_ripple={{ color: onSurface, radius: large ? 24 : 18 }}
      className={cn(
        "items-center justify-center p-3 disabled:opacity-25",
        { "p-2": large },
        className,
      )}
      {...pressableProps}
    >
      <Icon size={large ? 32 : 24} color={iconColor} filled={filled} />
    </Pressable>
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
