// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { memo, useMemo } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

import { cn } from "~/lib/style";
import type { ListItemContentProps } from "./ListItemContent";
import { ListItemContent } from "./ListItemContent";
import type { RipplePressProps } from "../Base/Pressable";
import { Ripple } from "../Base/Pressable";

export type ListItemProps = ListItemContentProps &
  RipplePressProps & {
    className?: string;
    style?: StyleProp<ViewStyle>;
  };

export const ListItem = memo(function StandardListItem(props: ListItemProps) {
  const Wrapper = useMemo(
    () => (!props.onPress ? View : Ripple),
    [props.onPress],
  );
  return (
    <Wrapper
      {...props}
      className={cn(
        "min-h-12 flex-row items-center gap-2 rounded-xs",
        props.className,
      )}
    >
      <ListItemContent {...props} />
    </Wrapper>
  );
});
