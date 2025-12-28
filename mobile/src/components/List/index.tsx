import { memo, useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, View } from "react-native";

import { cn } from "~/lib/style";
import type { ListItemContentProps } from "./ListItemContent";
import { ListItemContent } from "./ListItemContent";
import type { PressProps } from "../Form/Button";

export type ListItemProps = ListItemContentProps &
  PressProps & {
    className?: string;
    style?: StyleProp<ViewStyle>;
    /** Used internally to set the default pressed & disabled styles. */
    _psuedoClassName?: string;
    /** If the wrapping container should be a `View` instead of a `Pressable`. */
    _asView?: boolean;
  };

export const ListItem = memo(function StandardListItem({
  _psuedoClassName = "active:bg-surface/50",
  _asView = false,
  ...props
}: ListItemProps) {
  const Wrapper = useMemo(() => (_asView ? View : Pressable), [_asView]);
  return (
    <Wrapper
      {...props}
      className={cn(
        "min-h-12 flex-row items-center gap-2 rounded-sm",
        _psuedoClassName,
        props.className,
      )}
    >
      <ListItemContent {...props} />
    </Wrapper>
  );
});
