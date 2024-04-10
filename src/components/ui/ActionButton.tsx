import type { PressableProps } from "react-native";
import { Pressable, View } from "react-native";

import { cn } from "@/lib/style";
import type { OptString } from "@/components/ui/Text";
import { TextStack } from "@/components/ui/Text";

/**
 * @description Button displaying up to 2 lines of text, with up to 2
 *  different press scenarios (pressing the whole card or the optional
 *  icon will do different actions).
 */
export function ActionButton(props: {
  onPress: PressableProps["onPress"];
  textContent: [string, OptString];
  image?: React.JSX.Element;
  /** Displays between the `<TextStack />` & optional icon. */
  asideContent?: React.JSX.Element;
  icon?: React.JSX.Element;
  iconOnPress?: PressableProps["onPress"];
  wrapperClassName?: string;
}) {
  return (
    <Pressable
      onPress={props.onPress}
      className={cn(
        "flex-row items-center gap-2 rounded-sm border border-surface500 p-1",
        props.wrapperClassName,
      )}
    >
      {props.image}
      <TextStack content={props.textContent} wrapperClassName="flex-1" />
      {props.asideContent}
      {!!props.icon &&
        (props.iconOnPress ? (
          <Pressable onPress={props.iconOnPress} className="shrink-0">
            {props.icon}
          </Pressable>
        ) : (
          <View className="shrink-0">{props.icon}</View>
        ))}
    </Pressable>
  );
}
