import React, { createContext, memo, use } from "react";

import { cn } from "~/lib/style";
import { FlatList } from "~/components/Defaults";
import type { ListItemProps } from "./index";
import { ListItem } from "./index";

// If `<SegmentedListItem />` isn't wrapped, default to regular border radius.
const DEFAULT_STATE = { first: true, last: true };
const INIT_STATE = { first: false, last: false };
const ListItemPositionContext = createContext(DEFAULT_STATE);

//#region SegmentedListContainer
/** Automatically applies styling to the first & last `<SegmentedListItem />`. */
export function SegmentedListContainer(props: { children: React.ReactNode }) {
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
        contentContainerClassName="gap-0.75"
      />
    </ListItemPositionContext>
  );
}
//#endregion

//#region SegmentedListItem
export const SegmentedListItem = memo(function SegmentedListItem(
  props: ListItemProps,
) {
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
});
//#endregion
