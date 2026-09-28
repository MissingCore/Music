// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { View } from "react-native";

import { cn } from "~/lib/style";
import type { MediaImageSrc } from "./media-image";
import { MediaImage } from "./media-image";
import { Ripple } from "../base/ripple";
import { createTextStack } from "../blocks/text-stack";

export type ImageListItemProps = {
  label: string;
  supporting?: string;
  /** If provided, will change the wrapper to `Ripple` from `View`. */
  onPress?: VoidFunction;
  /** If provided, will change the wrapper to `Ripple` from `View`. */
  onLongPress?: VoidFunction;
  className?: string;
  Trailing?: React.ReactNode;
  /**
   * Applies spacing styles when used in a list. Defaults to `true`.
   *
   * **Make sure to apply `-mx-0.5 -mb-1` to the `className` of the scroll
   * container this is in.**
   */
  applySpacing?: boolean;
} & (
  | { src: MediaImageSrc; Leading?: never }
  | { src?: never; Leading: React.ReactNode }
);

const ListItemTextStack = createTextStack({
  labelConfig: { size: "sm" },
  supportingConfig: { muted: true },
  clampText: true,
});

export function ImageListItem(props: ImageListItemProps) {
  const Wrapper = props.onPress || props.onLongPress ? Ripple : View;
  return (
    <Wrapper
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      className={cn(
        "flex-row items-center gap-2 rounded-lg pr-2",
        props.applySpacing !== false && "mx-0.5 mb-1",
        !props.Trailing && "pr-4",
        props.className,
      )}
    >
      {props.Leading ? (
        props.Leading
      ) : (
        <MediaImage src={props.src!} size={56} className="rounded-lg" />
      )}
      <ListItemTextStack label={props.label} supporting={props.supporting} />
      {props.Trailing}
    </Wrapper>
  );
}
