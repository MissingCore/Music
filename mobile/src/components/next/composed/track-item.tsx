// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  useTrackFavoriteStatus,
  useToggleTrackInPlaylist,
} from "~/data/track/queries";
import { PlaybackControls, Queue } from "~/stores/Playback/actions";
import type { PlayFromSource } from "~/stores/Playback/types";
import { usePreferenceStore } from "~/stores/Preference/store";
import { presentTrackSheet } from "~/stores/Session/actions";
import {
  TrackMultiSelect,
  useTrackMultiSelectStore,
} from "~/modules/media/multiSelect/core/store";

import { mutateGuard } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { PlayingIndicator } from "~/modules/media/components/AnimatedBars";
import { FavoritesPlaylistKey } from "~/modules/media/constants";
import type { ImageListItemProps } from "./image-list-item";
import { ImageListItem } from "./image-list-item";
import type { MediaImageSrc } from "./media-image";
import type { ButtonSize } from "../blocks/icon-button";
import { IconButton } from "../blocks/icon-button";
import { Pressable } from "../primitive/pressable";

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
      })}
    />
  );
}

//#region Track Actions
export function TrackAction(props: { id: string; title: string }) {
  const { t } = useTranslation();
  const quickAddQueue = usePreferenceStore((s) => s.quickAddQueue);
  const quickFavorite = usePreferenceStore((s) => s.quickFavorite);

  //? Outer pressable is to prevent touch propagation to parent pressable due to
  //? the icons not taking up the full height.
  return (
    <Pressable className="h-full flex-row items-center gap-1">
      {quickFavorite ? <FavoriteButton id={props.id} /> : null}
      {quickAddQueue ? (
        <IconButton
          icon="queue-music"
          accessibilityLabel={t("feat.queue.extra.playNext")}
          onPress={() => Queue.add({ id: props.id, name: props.title })}
        />
      ) : null}
      <IconButton
        icon="more-vert"
        accessibilityLabel={t("template.entrySeeMore", { name: props.title })}
        onPress={() => presentTrackSheet(props.id)}
      />
    </Pressable>
  );
}

export function FavoriteButton(props: { id: string; size?: ButtonSize }) {
  const { t } = useTranslation();
  const { data: favoriteStatus } = useTrackFavoriteStatus(props.id);
  const toggleInPlaylist = useToggleTrackInPlaylist(props.id);

  const favStatus = favoriteStatus ?? false;
  const isFav = toggleInPlaylist.isPending ? !favStatus : favStatus;

  return (
    <IconButton
      icon={`favorite${isFav ? "-filled" : ""}`}
      accessibilityLabel={t(`term.${isFav ? "unF" : "f"}avorite`)}
      onPress={() => mutateGuard(toggleInPlaylist, FavoritesPlaylistKey)}
      size={props.size}
    />
  );
}
//#endregion
