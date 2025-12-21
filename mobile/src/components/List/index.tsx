import { memo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable } from "react-native";

import { cn } from "~/lib/style";
import type { ListItemContentProps } from "./ListItemContent";
import { ListItemContent } from "./ListItemContent";
import type { PressProps } from "../Form/Button";

export type ListItemProps = ListItemContentProps &
  PressProps & {
    className?: string;
    style?: StyleProp<ViewStyle>;
    /** Pass pseudo-element classes via this prop (ie: `active:*`, `disabled:*`). */
    psuedoClassName?: string;
  };

export const ListItem = memo(function StandardListItem({
  className,
  psuedoClassName = "active:bg-onSurface/25",
  ...props
}: ListItemProps) {
  return (
    <Pressable
      {...props}
      className={cn(
        "min-h-12 flex-row items-center gap-2 rounded-xs",
        className,
        psuedoClassName,
      )}
    >
      <ListItemContent {...props} />
    </Pressable>
  );
});
