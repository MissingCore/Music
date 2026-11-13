// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ViewStyle } from "react-native";
import { View } from "react-native";

import { cn } from "~/lib/style";
import type { MediaImageSrc } from "../blocks/media-image";
import { MediaImage } from "../blocks/media-image";
import type { RippleConfig } from "../themed/ripple";
import { Ripple } from "../themed/ripple";
import { TextStack } from "../themed/text-stack";

export type ImageListItemProps = Pick<RippleConfig, "surfaceColor"> & {
  src: MediaImageSrc;
  label: string;
  supporting?: string;
  /** If provided, will change the wrapper to `Ripple` from `View`. */
  onPress?: VoidFunction;
  /** If provided, will change the wrapper to `Ripple` from `View`. */
  onLongPress?: VoidFunction;
  className?: string;
  style?: ViewStyle;
  Leading?: React.ReactNode;
  Trailing?: React.ReactNode;
  /**
   * If we apply our fake gaps for columns (`mx-0.75`). Defaults `true`.
   *
   * **Make sure to apply `-mx-0.75` to the `className` of the scroll
   * container this is in.**
   */
  columnSpacing?: boolean;
  /** If we don't want to render the `MediaImage` defined by `src`. */
  leadingOverridesSrc?: boolean;
};

export function ImageListItem(props: ImageListItemProps) {
  const Wrapper = props.onPress || props.onLongPress ? Ripple : View;
  return (
    <Wrapper
      onPress={props.onPress}
      onLongPress={props.onLongPress}
      surfaceColor={props.surfaceColor}
      style={props.style}
      className={cn(
        "flex-row items-center gap-2 rounded-lg pr-2",
        props.columnSpacing !== false && "mx-0.75",
        !props.Trailing && "pr-4",
        props.className,
      )}
    >
      {props.Leading}
      {props.Leading && props.leadingOverridesSrc ? null : (
        <MediaImage src={props.src} size={56} className="rounded-lg" />
      )}
      <TextStack label={props.label} supporting={props.supporting} clamp />
      {props.Trailing}
    </Wrapper>
  );
}
