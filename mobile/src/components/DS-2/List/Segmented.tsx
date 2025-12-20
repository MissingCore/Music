import React, { createContext, memo, use } from "react";
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

//#region Exports
SegmentedList.Item = memo(SegmentedListItem);
/**
 * Wraps non-standard items while having the benefit of the automatic styling.
 *  - Set `psuedoClassName = "active:bg-canvas/30"` for color-matching on pressed state.
 */
SegmentedList.ItemGroup = memo(SegmentedListItemGroup);

export { SegmentedList };
//#endregion
