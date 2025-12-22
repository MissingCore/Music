import type { LegendListProps } from "@legendapp/list";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MoreVert } from "~/resources/icons/MoreVert";
import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls } from "~/stores/Playback/actions";
import { presentTrackSheet } from "~/services/SessionStore";

import { IconButton } from "~/components/Form/Button";
import { SearchResult } from "~/modules/search/components/SearchResult";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import type { PlayFromSource } from "~/stores/Playback/types";
import { arePlaybackSourceEqual } from "~/stores/Playback/utils";
import { PlayingIndicator } from "./AnimatedBars";
import type { TrackContent, TrackProps } from "./Track.type";

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
  const { t } = useTranslation();

  const overriddenLeftElement = useMemo(
    () => (showIndicator ? <PlayingIndicator /> : LeftElement),
    [LeftElement, showIndicator],
  );

  return (
    <SearchResult
      button
      type="track"
      onPress={() =>
        PlaybackControls.playFromList({ trackId: id, source: trackSource })
      }
      LeftElement={overriddenLeftElement}
      RightElement={
        <IconButton
          Icon={MoreVert}
          accessibilityLabel={t("template.entrySeeMore", { name: props.title })}
          onPress={() => presentTrackSheet(id)}
        />
      }
      poppyLabel={showIndicator}
      {...props}
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

  const passPreCheck = useMemo(
    () => arePlaybackSourceEqual(currSource, listSource),
    [currSource, listSource],
  );

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
      getEstimatedItemSize: (index) => (index === 0 ? 48 : 56),
      data,
      keyExtractor: ({ id }) => id,
      renderItem: ({ item, index }) => (
        <Track
          {...item}
          trackSource={args.trackSource}
          className={index > 0 ? "mt-2" : undefined}
        />
      ),
      ListEmptyComponent: (
        <ContentPlaceholder
          isPending={args.isPending}
          errMsgKey="err.msg.noTracks"
        />
      ),
    }),
    [args, data],
  ) satisfies Omit<LegendListProps<TrackContent>, "data"> & {
    data?: readonly TrackContent[];
  };
}
//#endregion
