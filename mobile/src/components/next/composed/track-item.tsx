// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";

import { PlaybackControls } from "~/stores/Playback/actions";
import type { PlayFromSource } from "~/stores/Playback/types";
import {
  TrackMultiSelect,
  useTrackMultiSelectStore,
} from "~/modules/media/multiSelect/core/store";

import { cn } from "~/lib/style";
import { PlayingIndicator } from "~/modules/media/components/AnimatedBars";
import { TrackAction } from "~/modules/media/components/Track";
import type { ImageListItemProps } from "./image-list-item";
import { ImageListItem } from "./image-list-item";
import type { MediaImageSrc } from "./media-image";

interface TrackItemProps {
  id: string;
  trackSource: PlayFromSource;
  title: string;
  description?: string;
  imageSource: MediaImageSrc;
  /** Indicate that this track is being played. */
  showIndicator?: boolean;
  Leading?: React.ReactNode;
  className?: string;
}

export function TrackItem({
  id,
  trackSource,
  Leading,
  showIndicator,
  className,
  ...props
}: TrackItemProps) {
  const isMultiSelectEnabled = useTrackMultiSelectStore((s) => s.enabled);
  const isSelected = useTrackMultiSelectStore((s) => s.selected.has(id));

  const overriddenLeadingElement = useMemo(
    () => (showIndicator ? <PlayingIndicator padding={16} /> : Leading),
    [Leading, showIndicator],
  );

  const normalActions: Partial<ImageListItemProps> = useMemo(
    () => ({
      onPress: () =>
        PlaybackControls.playFromList({ trackId: id, source: trackSource }),
      onLongPress: TrackMultiSelect.enable,
      Trailing: <TrackAction id={id} title={props.title} />,
    }),
    [id, trackSource, props.title],
  );

  const multiSelectActions: Partial<ImageListItemProps> = useMemo(
    () => ({
      //* This will get triggered after releasing long-press action on
      //* track to enable multi-select.
      onPress: () => TrackMultiSelect.toggleSelection(id),
    }),
    [id],
  );

  return (
    // @ts-expect-error - Props are compatible.
    <ImageListItem
      label={props.title}
      supporting={props.description}
      src={props.imageSource}
      {...(isMultiSelectEnabled ? multiSelectActions : normalActions)}
      Leading={overriddenLeadingElement}
      className={cn(className, {
        "bg-primary/25": showIndicator && !isMultiSelectEnabled,
        "bg-surfaceContainerLowest": isSelected,
        "pr-4": isMultiSelectEnabled,
      })}
    />
  );
}
