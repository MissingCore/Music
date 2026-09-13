// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { getImageUri } from "~/lib/file-system";
import { cn } from "~/lib/style";
import { Ripple } from "../base/ripple";
import { createTextStack } from "../blocks/text-stack";
import { Image } from "../primitive/image";

interface ImageListItemProps {
  src: string | null | undefined;
  label: string;
  supporting?: string;
  /** If provided, will change the wrapper to `Ripple` from `View`. */
  onPress?: VoidFunction;
  className?: string;
  Trailing?: React.ReactNode;
}

const ListItemTextStack = createTextStack({
  labelConfig: { size: "sm" },
  supportingConfig: { muted: true },
  clampText: true,
});

export function ImageListItem(props: ImageListItemProps) {
  const Wrapper = props.onPress ? Ripple : View;
  return (
    <Wrapper
      pointerEvents="box-only"
      onPress={props.onPress}
      className={cn("flex-row items-center gap-2 rounded-lg", props.className)}
    >
      <Image
        source={getImageUri(props.src)}
        className="size-14 rounded-lg bg-surfaceContainerHigh"
      />
      <ListItemTextStack label={props.label} supporting={props.supporting} />
      {props.Trailing}
    </Wrapper>
  );
}
