import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";

/** Shared props between `<Checkbox />` and `<Radio />` */
type OptionProps = {
  onSelect: () => void;
  selected: boolean;
  children: React.JSX.Element;
  /** Styles applied to the `<View />` wrapping the `<Pressable />`. */
  containerStyle?: StyleProp<ViewStyle>;
  /** Classnames applied to the `<View />` wrapping the `<Pressable />`. */
  containerClassName?: string;
  /** Styles applied to the `<Pressable />` wrapping the `children`. */
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Classnames applied to the `<Pressable />` wrapping the `children`. */
  contentContainerClassName?: string;
};

/** Controlled checkbox component. */
export function Checkbox(props: OptionProps) {
  return <Option type="checkbox" {...props} />;
}

/** Controlled radio button component. */
export function Radio(props: OptionProps) {
  return <Option type="radio" {...props} />;
}

/** Based for controlled checkbox or radio component. */
function Option(props: OptionProps & { type: "checkbox" | "radio" }) {
  const { surface } = useTheme();
  return (
    <View
      style={props.containerStyle}
      className={cn("overflow-hidden rounded-md", props.containerClassName)}
    >
      <Pressable
        android_ripple={{ color: surface }}
        onPress={props.onSelect}
        // `<Radio />` utilizes the `disabled` prop to prevent togglability.
        {...(props.type === "radio" ? { disabled: props.selected } : {})}
        style={props.contentContainerStyle}
        className={cn(
          "min-h-12 p-4",
          // "Selected" styling is handled differently.
          {
            "bg-surface active:opacity-75":
              props.type === "checkbox" && props.selected,
            "disabled:bg-surface": props.type === "radio",
          },
          props.contentContainerClassName,
        )}
      >
        {props.children}
      </Pressable>
    </View>
  );
}
