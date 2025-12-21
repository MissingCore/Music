import React, { createContext, memo, use, useMemo } from "react";
import { View } from "react-native";

import { cn } from "~/lib/style";
import { FlatList } from "~/components/Defaults";
import type { ListItemProps } from "./index";
import { ListItem } from "./index";

// If list item isn't wrapped, default to regular border radius.
const DEFAULT_STATE = { first: true, last: true };
const INIT_STATE = { first: false, last: false };
const ListItemPositionContext = createContext(DEFAULT_STATE);

//#region Container
/**
 * Automatically applies styling to the first & last `<SegmentedListItem />`
 * or `<SegmentedListItemGroup />`.
 */
function SegmentedList(props: { children: React.ReactNode }) {
  const data: React.ReactNode[] = Array.isArray(props.children)
    ? props.children
    : React.Children.toArray(props.children);

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
        scrollEnabled={false}
        className="grow-0"
        contentContainerClassName="gap-0.75"
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
        { "rounded-t-xs": !first, "rounded-b-xs": !last },
        props.className,
      )}
      psuedoClassName={cn(
        "active:opacity-75 disabled:opacity-25",
        props.psuedoClassName,
      )}
      _overflow
    />
  );
}
//#endregion

//#region ItemGroup
function SegmentedListItemGroup(props: {
  className?: string;
  children: React.ReactNode;
}) {
  const { first, last } = use(ListItemPositionContext);
  return (
    <View
      className={cn(
        "overflow-hidden rounded-md bg-surface",
        { "rounded-t-xs": !first, "rounded-b-xs": !last },
        props.className,
      )}
    >
      {props.children}
    </View>
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
            "mt-0.75 rounded-t-xs": index > 0,
            "rounded-b-xs": index < (data?.length ?? 0) - 1,
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
 * Wraps non-standard items while having the benefit of the automatic styling.
 *  - Set `psuedoClassName = "active:bg-canvas/30"` for color-matching on pressed state.
 */
SegmentedList.ItemGroup = memo(SegmentedListItemGroup);

export { SegmentedList };
//#endregion
