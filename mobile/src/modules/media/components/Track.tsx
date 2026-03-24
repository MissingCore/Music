import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MoreVert } from "~/resources/icons/MoreVert";
import { QueueMusic } from "~/resources/icons/QueueMusic";
import { usePlaybackStore } from "~/stores/Playback/store";
import { PlaybackControls, Queue } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";
import { presentTrackSheet } from "~/stores/Session/actions";

import type { LegendListProps } from "~/components/Base/LegendList";
import { Pressable } from "~/components/Base/Pressable";
import { IconButton } from "~/components/Form/Button/Icon";
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
  const quickAddQueue = usePreferenceStore((s) => s.quickAddQueue);

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
      RightElement={
        <Pressable className="h-full flex-row items-center gap-1">
          {quickAddQueue ? (
            <IconButton
              Icon={QueueMusic}
              accessibilityLabel={t("feat.queue.extra.playNext")}
              onPress={() => Queue.add({ id, name: props.title })}
            />
          ) : null}
          <IconButton
            Icon={MoreVert}
            accessibilityLabel={t("template.entrySeeMore", {
              name: props.title,
            })}
            onPress={() => presentTrackSheet(id)}
          />
        </Pressable>
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
