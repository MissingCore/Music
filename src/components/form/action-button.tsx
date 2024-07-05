import type { PressableProps } from "react-native";
import { Platform, View } from "react-native";

import { EllipsisVertical } from "@/assets/svgs/EllipsisVertical";

import { cn } from "@/lib/style";
import type { Maybe } from "@/utils/types";
import { StyledPressable } from "../ui/pressable";
import { TextStack } from "../ui/text";

export namespace ActionButton {
  export interface Props {
    onPress: PressableProps["onPress"];
    textContent: [string, Maybe<string>];
    Image?: React.JSX.Element;
    /** Displays between the `<TextStack />` & optional icon. */
    AsideContent?: React.JSX.Element;
    icon?: {
      Element?: React.JSX.Element;
      /** Accessibility label for icon. */
      label?: string;
      onPress?: PressableProps["onPress"];
    };
    withoutIcon?: boolean;
    className?: string;
  }
}

/**
 * @description Button displaying up to 2 lines of text, with up to 2
 *  different press scenarios (pressing the whole card or the optional
 *  icon will do different actions).
 */
export function ActionButton(props: ActionButton.Props) {
  const icon = props.icon?.Element ?? <EllipsisVertical size={24} />;

  return (
    <StyledPressable
      onPress={props.onPress}
      // Prevent ripple effect from occuring if `onPress` is undefined.
      disabled={!props.onPress}
      className={cn(
        "h-[58px] flex-row items-center rounded border border-surface500 p-1",
        {
          "px-2": !props.Image,
          "pr-0": !props.withoutIcon,
          "active:bg-surface700 active:opacity-100": Platform.OS !== "android",
        },
        props.className,
      )}
    >
      <View className="shrink flex-row items-center gap-2">
        {props.Image}
        <TextStack content={props.textContent} wrapperClassName="flex-1" />
        {props.AsideContent}
      </View>
      {props.withoutIcon ? null : props.icon?.onPress ? (
        <StyledPressable
          accessibilityLabel={props.icon.label}
          onPress={props.icon.onPress}
          forIcon
          className="shrink-0"
        >
          {icon}
        </StyledPressable>
      ) : (
        <View className="shrink-0 p-3">{icon}</View>
      )}
    </StyledPressable>
  );
}
