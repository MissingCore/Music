import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, View } from "react-native";

import { useTheme } from "@/hooks/useTheme";

import { cn } from "@/lib/style";

/** Shared props between `<Checkbox />` and `<Radio />`. */
type SelectionProps = {
  children: React.JSX.Element;
  onSelect: () => void;
  selected: boolean;
  /** Styles applied to the `<View />` wrapping the `<Pressable />`. */
  wrapperStyle?: StyleProp<ViewStyle>;
  /** Classnames applied to the `<View />` wrapping the `<Pressable />`. */
  wrapperClassName?: string;
  style?: StyleProp<ViewStyle>;
  className?: string;
};

/** Controlled checkbox component. */
export function Checkbox(props: SelectionProps) {
  return <Selection type="checkbox" {...props} />;
}

/** Controlled radio button component. */
export function Radio(props: SelectionProps) {
  return <Selection type="radio" {...props} />;
}

/** Base for controlled checkbox or radio component. */
function Selection(props: SelectionProps & { type: "checkbox" | "radio" }) {
  const { surface } = useTheme();
  return (
    <View
      style={props.wrapperStyle}
      className={cn("overflow-hidden rounded-md", props.wrapperClassName)}
    >
      <Pressable
        android_ripple={{ color: surface }}
        onPress={props.onSelect}
        // `<Radio />` utilizes the `disabled` prop to prevent togglability.
        disabled={props.type === "radio" ? props.selected : undefined}
        style={props.style}
        className={cn(
          "min-h-12 p-4",
          // "Selected" styling is handled differently.
          {
            "bg-surface active:opacity-75":
              props.type === "checkbox" && props.selected,
            "disabled:bg-surface": props.type === "radio",
          },
          props.className,
        )}
      >
        {props.children}
      </Pressable>
    </View>
  );
}
