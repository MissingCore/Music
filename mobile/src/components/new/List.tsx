import type { VariantProps } from "cva";
import { cva } from "cva";
import { Pressable, Text, View } from "react-native";

import type { TextColor } from "@/lib/style";
import { cn } from "@/lib/style";
import { cardStyles } from "./Card";

//#region List
/** Wrapper for list of `<ListItem />` for consistent gaps. */
export function List({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={cn("gap-1", className)}>{children}</View>;
}
//#endregion

//#region List Item
export type listItemStyleProps = VariantProps<typeof listItemStyles>;
export const listItemStyles = cva({
  base: [cardStyles, "min-h-12"],
  variants: {
    first: { true: "", false: "rounded-t-sm" },
    last: { true: "", false: "rounded-b-sm" },
    pressable: {
      true: "transition-opacity active:opacity-75 disabled:opacity-25",
      false: "",
    },
    withIcon: { true: "flex-row items-center gap-4", false: "" },
  },
  defaultVariants: {
    first: false,
    last: false,
    pressable: false,
    withIcon: false,
  },
});

export namespace ListItem {
  type Common = { className?: string } & (
    | { onPress?: undefined; disabled?: never }
    | { onPress: () => void; disabled?: boolean }
  );

  export type StaticContent = {
    title: string;
    description?: string;
    icon?: React.ReactNode;
  };
  export type DynamicContent = { content: React.ReactNode };
  export type Content = (StaticContent | DynamicContent) & {
    textColor?: TextColor;
  };

  export type Props = Common &
    Content &
    Omit<listItemStyleProps, "pressable" | "withIcon">;
}

/** Static or pressable card themed after Nothing OS 3.0's setting page. */
export function ListItem({
  first,
  last,
  className,
  disabled,
  onPress,
  ...rest
}: ListItem.Props) {
  // @ts-expect-error ts(2339) We only care if the `icon` prop is defined.
  const withIcon = !!rest?.icon;

  if (onPress === undefined) {
    return (
      <View
        className={cn(listItemStyles({ first, last, withIcon }), className)}
      >
        <ListItemLayout {...rest} />
      </View>
    );
  }
  return (
    <Pressable
      {...{ onPress, disabled }}
      className={cn(
        listItemStyles({ first, last, pressable: true, withIcon }),
        className,
      )}
    >
      <ListItemLayout {...rest} />
    </Pressable>
  );
}

/** Checks what content we want to display inside an `<ListItem />`. */
function ListItemLayout({ textColor, ...props }: ListItem.Content) {
  const usedColor = textColor ?? "text-foreground";
  if (isDynamicContent(props)) return props.content;
  return (
    <>
      <View className="shrink grow gap-0.5">
        <Text className={cn("font-roboto text-base", usedColor)}>
          {props.title}
        </Text>
        {props.description ? (
          <Text className={cn("font-roboto text-xs opacity-50", usedColor)}>
            {props.description}
          </Text>
        ) : null}
      </View>
      {props.icon}
    </>
  );
}

/** Type guard to determine which content option is used. */
function isDynamicContent(
  content: ListItem.StaticContent | ListItem.DynamicContent,
): content is ListItem.DynamicContent {
  return content.hasOwnProperty("content");
}
//#endregion
