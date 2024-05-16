import type { PressableProps } from "react-native";
import { Pressable, View } from "react-native";

import { EllipsisVertical } from "@/assets/svgs/EllipsisVertical";

import { cn } from "@/lib/style";
import type { Maybe } from "@/utils/types";
import { TextStack } from "@/components/ui/Text";

/**
 * @description Button displaying up to 2 lines of text, with up to 2
 *  different press scenarios (pressing the whole card or the optional
 *  icon will do different actions).
 */
export function ActionButton(props: {
  onPress: PressableProps["onPress"];
  textContent: [string, Maybe<string>];
  Image?: React.JSX.Element;
  /** Displays between the `<TextStack />` & optional icon. */
  AsideContent?: React.JSX.Element;
  Icon?: React.JSX.Element;
  iconOnPress?: PressableProps["onPress"];
  withoutIcon?: boolean;
  className?: string;
}) {
  const icon = props.Icon ?? <EllipsisVertical size={24} />;

  return (
    <Pressable
      onPress={props.onPress}
      className={cn(
        "h-[58px] flex-row items-center gap-2 rounded p-1",
        "border border-surface500 active:bg-surface800",
        { "px-2": !props.Image },
        props.className,
      )}
    >
      {props.Image}
      <TextStack content={props.textContent} wrapperClassName="flex-1" />
      {props.AsideContent}
      {props.withoutIcon ? null : props.iconOnPress ? (
        <Pressable onPress={props.iconOnPress} className="shrink-0">
          {icon}
        </Pressable>
      ) : (
        <View className="shrink-0">{icon}</View>
      )}
    </Pressable>
  );
}
