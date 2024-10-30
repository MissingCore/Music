import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";

/** Button styled using `android_ripple` for press animations. */
export function Ripple(props: {
  children: React.ReactNode;
  onPress: () => void;
  /** Styles applied to the `<View />` wrapping the `<Pressable />`. */
  wrapperStyle?: StyleProp<ViewStyle>;
  /** Classnames applied to the `<View />` wrapping the `<Pressable />`. */
  wrapperClassName?: string;
  /** Styles applied to the `<Pressable />` wrapping the `children`. */
  style?: StyleProp<ViewStyle>;
  /** Classnames applied to the `<Pressable />` wrapping the `children`. */
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
