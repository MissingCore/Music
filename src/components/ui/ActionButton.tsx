import type { PressableProps } from "react-native";
import { Pressable, View } from "react-native";

import { EllipsisVertical } from "@/assets/svgs/EllipsisVertical";

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
  const icon = props.icon ?? <EllipsisVertical size={24} />;

  return (
    <Pressable
      onPress={props.onPress}
      className={cn(
        "flex-row items-center gap-2 rounded border border-surface500 p-1",
        "active:bg-surface800",
        props.wrapperClassName,
      )}
    >
      {props.image}
      <TextStack content={props.textContent} wrapperClassName="flex-1" />
      {props.asideContent}
      {props.iconOnPress ? (
        <Pressable onPress={props.iconOnPress} className="shrink-0">
          {icon}
        </Pressable>
      ) : (
        <View className="shrink-0">{icon}</View>
      )}
    </Pressable>
  );
}
