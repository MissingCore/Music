// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, use, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  useTrackFavoriteStatus,
  useToggleTrackInPlaylist,
} from "~/data/track/queries";
import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls, Queue } from "~/stores/Playback/actions";
import type { PlayFromSource } from "~/stores/Playback/types";
import { arePlaybackSourceEqual } from "~/stores/Playback/utils";
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

/** Obtain the list the track belongs to from a context to encourage memoization. */
export const TrackListContext = createContext<PlayFromSource>(null as never);

interface TrackItemProps {
  id: string;
  title: string;
  description?: string;
  imageSource: MediaImageSrc;
  Leading?: React.ReactNode;
  className?: string;
  /**
   * Escape hatch to run some logic after we play a track. For example,
   * we can update the sort order of the track list and refresh the queue.
   */
  _onAfterPlayPress?: () => void | Promise<void>;
}

export function TrackItem({
  id,
  Leading,
  className,
  _onAfterPlayPress,
  ...props
}: TrackItemProps) {
  const trackSource = use(TrackListContext);
  const isActiveTrack = usePlaybackStore(
    (s) =>
      arePlaybackSourceEqual(s.playingFrom, trackSource) &&
      s.activeTrack?.id === id,
  );
  const isMultiSelectEnabled = useTrackMultiSelectStore((s) => s.enabled);
  const isSelected = useTrackMultiSelectStore((s) => s.selected.has(id));

  const overriddenLeadingElement = useMemo(
    () => (isActiveTrack ? <PlayingIndicator padding={16} /> : Leading),
    [Leading, isActiveTrack],
  );

  const normalActions: Partial<ImageListItemProps> = useMemo(
    () => ({
      onPress: () => {
        PlaybackControls.playFromList({
          trackId: id,
          source: trackSource,
        }).then(() => _onAfterPlayPress?.());
      },
      onLongPress: TrackMultiSelect.enable,
      Trailing: <TrackAction id={id} title={props.title} />,
    }),
    [id, trackSource, _onAfterPlayPress, props.title],
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
    <ImageListItem
      src={props.imageSource}
      label={props.title}
      supporting={props.description}
      {...(isMultiSelectEnabled ? multiSelectActions : normalActions)}
      Leading={overriddenLeadingElement}
      leadingOverridesSrc
      className={cn(className, {
        "bg-primary/25": isActiveTrack && !isMultiSelectEnabled,
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
