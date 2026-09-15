// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { cn } from "~/lib/style";
import type { MediaImageSrc } from "./media-image";
import { MediaImage } from "./media-image";
import { Ripple } from "../base/ripple";
import { createTextStack } from "../blocks/text-stack";

interface ImageListItemProps {
  src: MediaImageSrc;
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
      <MediaImage src={props.src} size={56} className="rounded-lg" />
      <ListItemTextStack label={props.label} supporting={props.supporting} />
      {props.Trailing}
    </Wrapper>
  );
}
