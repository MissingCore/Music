import type { FlashListProps } from "@shopify/flash-list";
import { Pressable, View } from "react-native";

import type { TextColor } from "@/lib/style";
import { cn } from "@/lib/style";
import type { WithListEmptyProps } from "../Defaults";
import { FlashList } from "../Defaults";
import { StyledText } from "../Typography";

//#region List
/** Wrapper for list of `<ListItem />` for consistent gaps. */
export function List(props: { children: React.ReactNode; className?: string }) {
  return (
    <View className={cn("gap-[3px]", props.className)}>{props.children}</View>
  );
}
//#endregion

//#region List Renderer
/** Represent structured data as `<ListItem />` in a `<FlashList />`. */
export function ListRenderer<TData extends Record<string, any>>({
  data,
  renderOptions: { getTitle, getDescription, onPress },
  ...props
}: WithListEmptyProps<
  Omit<FlashListProps<TData>, "renderItem"> & {
    renderOptions: {
      getTitle: (item: TData) => string;
      getDescription?: (item: TData) => string;
      onPress?: (item: TData) => () => void;
    };
  }
>) {
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
            onPress={onPress ? onPress(item) : undefined}
            {...{ first, last }}
            className={cn({ "mb-[3px]": !last })}
          />
        );
      }}
      {...props}
    />
  );
}
//#endregion

//#region List Item
/** Static or pressable card themed after Nothing OS 3.0's setting page. */
export function ListItem(props: {
  // Interactivity props.
  onPress?: () => void;
  disabled?: boolean;
  // Content props.
  title: string;
  description?: string;
  icon?: React.ReactNode;
  // Styling props.
  first?: boolean;
  last?: boolean;
  textColor?: TextColor;
  className?: string;
}) {
  const asButton = props.onPress !== undefined;
  const withIcon = !!props.icon;
  const usedColor = props.textColor ?? "text-foreground";

  return (
    <Pressable
      onPress={props.onPress}
      // Have `<Pressable />` work as a `<View />` if no `onPress` is provided.
      disabled={asButton ? props.disabled : true}
      className={cn(
        "min-h-12 rounded-md bg-surface p-4",
        {
          "rounded-t-sm": !props.first,
          "rounded-b-sm": !props.last,
          "active:opacity-75 disabled:opacity-25": asButton,
          "flex-row items-center gap-4": withIcon,
        },
        props.className,
      )}
    >
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
    </Pressable>
  );
}
//#endregion
