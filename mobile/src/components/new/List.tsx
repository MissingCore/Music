import type { FlashListProps } from "@shopify/flash-list";
import { FlashList } from "@shopify/flash-list";
import type { VariantProps } from "cva";
import { cva } from "cva";
import { Pressable, View } from "react-native";

import type { TextColor } from "@/lib/style";
import { cn } from "@/lib/style";
import { cardStyles } from "./Card";
import { StyledText } from "./Typography";

//#region List
/** Wrapper for list of `<ListItem />` for consistent gaps. */
export function List({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <View className={cn("gap-[3px]", className)}>{children}</View>;
}
//#endregion

//#region List Renderer
/** Represent structured data as `<ListItem />` in a `<FlashList />`. */
export function ListRenderer<TData extends Record<string, any>>({
  data,
  renderOptions: { getTitle, getDescription, onPress },
  ...rest
}: Omit<FlashListProps<TData>, "renderItem"> & {
  renderOptions: {
    getTitle: (item: TData) => string;
    getDescription?: (item: TData) => string;
    onPress?: (item: TData) => () => void;
  };
}) {
  return (
    <FlashList
      estimatedItemSize={70}
      data={data}
      renderItem={({ item, index }) => {
        const first = index === 0;
        const last = index === data!.length - 1;
        return (
          <ListItem
            title={getTitle(item)}
            description={getDescription ? getDescription(item) : undefined}
            {...(onPress
              ? { onPress: onPress(item), disabled: false }
              : { onPress: undefined })}
            {...{ first, last }}
            className={cn({ "mb-[3px]": !last })}
          />
        );
      }}
      showsVerticalScrollIndicator={false}
      {...rest}
    />
  );
}
//#endregion

//#region List Item
export type ListItemStyleProps = VariantProps<typeof listItemStyles>;
export const listItemStyles = cva({
  base: [cardStyles, "min-h-12"],
  variants: {
    first: { true: "", false: "rounded-t-sm" },
    last: { true: "", false: "rounded-b-sm" },
    pressable: {
      true: "active:opacity-75 disabled:opacity-25",
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
    Omit<ListItemStyleProps, "pressable" | "withIcon">;
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
        <StyledText className={cn("text-sm", usedColor)}>
          {props.title}
        </StyledText>
        {props.description ? (
          <StyledText className={cn("text-xs opacity-50", usedColor)}>
            {props.description}
          </StyledText>
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
