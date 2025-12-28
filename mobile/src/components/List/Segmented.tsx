import React, { createContext, memo, use, useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import { cn } from "~/lib/style";
import type { ListItemProps } from "./index";
import { ListItem } from "./index";
import { FlatList } from "../Defaults";

// If list item isn't wrapped, default to regular border radius.
const DEFAULT_STATE = { first: true, last: true };
const INIT_STATE = { first: false, last: false };
const ListItemPositionContext = createContext(DEFAULT_STATE);

//#region Container
/**
 * Automatically applies styling to the first & last `<SegmentedListItem />`
 * or `<SegmentedListCustomItem />`.
 */
function SegmentedList(props: {
  children: React.ReactNode;
  scrollEnabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
  contentContainerClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
}) {
  const data: React.ReactNode[] = Array.isArray(props.children)
    ? props.children
    : // `flat(1)` is to handle fragments.
      React.Children.toArray(props.children).flat(1);

  return (
    <ListItemPositionContext value={INIT_STATE}>
      <FlatList
        data={data}
        keyExtractor={(_, index) => `${index}`}
        renderItem={({ item, index }) => {
          if (index !== 0 && index !== data.length - 1) return <>{item}</>;
          return (
            <ListItemPositionContext
              value={{ first: index === 0, last: index === data.length - 1 }}
            >
              {item}
            </ListItemPositionContext>
          );
        }}
        scrollEnabled={props.scrollEnabled ?? false}
        className={cn("grow-0", props.className)}
        style={props.style}
        contentContainerClassName={cn(
          "gap-[3px]",
          props.contentContainerClassName,
        )}
        contentContainerStyle={props.contentContainerStyle}
      />
    </ListItemPositionContext>
  );
}
//#endregion

//#region Item
function SegmentedListItem(props: ListItemProps) {
  const { first, last } = use(ListItemPositionContext);
  return (
    <ListItem
      {...props}
      className={cn(
        "rounded-md bg-surface p-4",
        { "rounded-t-sm": !first, "rounded-b-sm": !last },
        props.className,
      )}
      _psuedoClassName={cn(
        "active:opacity-75 disabled:opacity-25",
        props._psuedoClassName,
      )}
      _overflow
    />
  );
}
//#endregion

//#region Custom Item
function SegmentedListCustomItem(props: {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const { first, last } = use(ListItemPositionContext);
  return (
    <View
      {...props}
      className={cn(
        "overflow-hidden rounded-md bg-surface",
        { "rounded-t-sm": !first, "rounded-b-sm": !last },
        props.className,
      )}
    />
  );
}
//#endregion

//#region Generator Hook
/** Get props to render a list of `<SegmentedListItem />` inside a Legend List. */
export function useGeneratedSegmentedList<TData extends Record<string, any>>({
  data,
  renderOptions: { getLabel, getSupportingText, onPress },
}: {
  data?: readonly TData[];
  renderOptions: {
    getLabel: (item: TData) => string;
    getSupportingText: (item: TData) => string;
    onPress?: (item: TData) => VoidFunction;
  };
}) {
  return useMemo(
    () => ({
      getEstimatedItemSize: (index: number) => (index === 0 ? 70 : 73),
      data,
      renderItem: ({ item, index }: { item: TData; index: number }) => (
        <SegmentedListItem
          labelText={getLabel(item)}
          supportingText={getSupportingText(item)}
          onPress={onPress ? onPress(item) : undefined}
          className={cn({
            "mt-[3px] rounded-t-sm": index > 0,
            "rounded-b-sm": index < (data?.length ?? 0) - 1,
          })}
        />
      ),
    }),
    [data, getLabel, getSupportingText, onPress],
  );
}
//#endregion

//#region Exports
SegmentedList.Item = memo(SegmentedListItem);
/**
 * Wraps non-standard content while having the benefit of the automatic styling
 * while in `<SegmentedList />`.
 *  - Set `_psuedoClassName = "active:bg-canvas/30"` for color-matching on pressed state.
 */
SegmentedList.CustomItem = memo(SegmentedListCustomItem);

export { SegmentedList };
//#endregion
