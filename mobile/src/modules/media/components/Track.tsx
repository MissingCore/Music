import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Favorite } from "~/resources/icons/Favorite";
import { MoreVert } from "~/resources/icons/MoreVert";
import { QueueMusic } from "~/resources/icons/QueueMusic";
import {
  useTrackFavoriteStatus,
  useToggleTrackInPlaylist,
} from "~/data/track/queries";
import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls, Queue } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";
import { presentTrackSheet } from "~/stores/Session/actions";

import { mutateGuard } from "~/lib/react-query";
import type { LegendListProps } from "~/components/Base/LegendList";
import { Pressable } from "~/components/Base/Pressable";
import type { ButtonSize } from "~/components/Form/Button/Icon";
import { IconButton } from "~/components/Form/Button/Icon";
import { SearchResult } from "~/modules/search/components/SearchResult";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import type { PlayFromSource } from "~/stores/Playback/types";
import { arePlaybackSourceEqual } from "~/stores/Playback/utils";
import { PlayingIndicator } from "./AnimatedBars";
import type { TrackContent, TrackProps } from "./Track.type";
import { FavoritesPlaylistKey } from "../constants";

//#region Track
/**
 * Displays information about the current track with 2 different press
 * scenarios (pressing the icon or the whole card will do different actions).
 */
export function Track({
  id,
  trackSource,
  showIndicator,
  LeftElement,
  ...props
}: TrackProps) {
  const overriddenLeftElement = useMemo(
    () => (showIndicator ? <PlayingIndicator /> : LeftElement),
    [LeftElement, showIndicator],
  );

  return (
    <SearchResult
      type="track"
      onPress={() =>
        PlaybackControls.playFromList({ trackId: id, source: trackSource })
      }
      LeftElement={overriddenLeftElement}
      RightElement={<TrackAction id={id} title={props.title} />}
      poppyLabel={showIndicator}
      {...props}
    />
  );
}
//#endregion

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
          Icon={QueueMusic}
          accessibilityLabel={t("feat.queue.extra.playNext")}
          onPress={() => Queue.add({ id: props.id, name: props.title })}
        />
      ) : null}
      <IconButton
        Icon={MoreVert}
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
      Icon={Favorite}
      accessibilityLabel={t(`term.${isFav ? "unF" : "f"}avorite`)}
      onPress={() => mutateGuard(toggleInPlaylist, FavoritesPlaylistKey)}
      alternative={isFav}
      size={props.size}
    />
  );
}
//#endregion

//#region useTrackListPlayingIndication
/** Mark the track that's currently being played in the data. */
export function useTrackListPlayingIndication<T extends TrackContent>(
  listSource: PlayFromSource,
  tracks?: T[],
): Array<T & { showIndicator?: boolean }> | undefined {
  const currSource = usePlaybackStore((s) => s.playingFrom);
  const activeTrack = usePlaybackStore((s) => s.activeTrack);

  const passPreCheck = arePlaybackSourceEqual(currSource, listSource);

  return useMemo(() => {
    if (!passPreCheck || !tracks || !activeTrack) return tracks;
    return tracks.map((t) => {
      if (t.id !== activeTrack.id) return t;
      return { ...t, showIndicator: true };
    });
  }, [passPreCheck, activeTrack, tracks]);
}
//#endregion

//#region useTrackListPreset
/** Presets used to render a list of `<Track />`. */
export function useTrackListPreset(args: {
  data?: readonly TrackContent[];
  trackSource: PlayFromSource;
  isPending?: boolean;
}) {
  // @ts-expect-error - Readonly is fine.
  const data = useTrackListPlayingIndication(args.trackSource, args.data);
  return useMemo(
    () => ({
      estimatedItemSize: 56, // 48px Height + 8px Margin Bottom
      data,
      keyExtractor: ({ id }) => id,
      renderItem: ({ item }) => (
        <Track {...item} trackSource={args.trackSource} className="mb-2" />
      ),
      ListEmptyComponent: (
        <ContentPlaceholder
          isPending={args.isPending || args.data === undefined}
          errMsgKey="err.msg.noTracks"
        />
      ),
      className: "-mb-2",
    }),
    [args, data],
  ) satisfies LegendListProps<TrackContent>;
}
//#endregion
