import { memo, useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import { cn } from "~/lib/style";
import type { ListItemContentProps } from "./ListItemContent";
import { ListItemContent } from "./ListItemContent";
import { Pressable } from "../Base/Pressable";
import type { PressProps } from "../Form/Button/types";

export type ListItemProps = ListItemContentProps &
  PressProps & {
    className?: string;
    style?: StyleProp<ViewStyle>;
    /** Used internally to set the default pressed & disabled styles. */
    _psuedoClassName?: string;
  };

export const ListItem = memo(function StandardListItem({
  _psuedoClassName = "active:bg-surfaceContainerLowest/50",
  ...props
}: ListItemProps) {
  const Wrapper = useMemo(
    () => (!props.onPress ? View : Pressable),
    [props.onPress],
  );
  return (
    <Wrapper
      {...props}
      className={cn(
        "min-h-12 flex-row items-center gap-2 rounded-xs",
        _psuedoClassName,
        props.className,
      )}
    >
      <ListItemContent {...props} />
    </Wrapper>
  );
});
