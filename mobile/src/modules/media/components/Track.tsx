import type { FlashListProps } from "@shopify/flash-list";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MoreVert } from "~/resources/icons/MoreVert";
import { presentTrackSheet } from "~/services/SessionStore";
import { useMusicStore } from "../services/Music";
import { playFromMediaList } from "../services/Playback";

import { cn } from "~/lib/style";
import type { Prettify } from "~/utils/types";
import type { PressProps } from "~/components/Form/Button";
import { IconButton } from "~/components/Form/Button";
import { SearchResult } from "~/modules/search/components/SearchResult";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import { PlayingIndicator } from "./AnimatedBars";
import { arePlaybackSourceEqual } from "../helpers/data";
import type { PlayListSource } from "../types";

//#region Track
export namespace Track {
  export type Content = Required<
    Pick<SearchResult.Content, "title" | "description" | "imageSource">
  > & { id: string };

  export type Props = Prettify<
    Content &
      Omit<PressProps, "onPress"> & {
        /** Indicate that this track is being played. */
        showIndicator?: boolean;
        trackSource: PlayListSource;
        LeftElement?: React.JSX.Element;
        /** Note: Maps to `wrapperClassName` on `<SearchResult />`. */
        className?: string;
      }
  >;
}

/**
 * Displays information about the current track with 2 different press
 * scenarios (pressing the icon or the whole card will do different actions).
 */
export function Track({
  id,
  trackSource,
  className,
  showIndicator,
  LeftElement,
  ...props
}: Track.Props) {
  const { t } = useTranslation();

  const overriddenLeftElement = useMemo(
    () => (showIndicator ? <PlayingIndicator /> : LeftElement),
    [LeftElement, showIndicator],
  );

  return (
    <SearchResult
      as="ripple"
      type="track"
      onPress={() => playFromMediaList({ trackId: id, source: trackSource })}
      RightElement={
        <IconButton
          Icon={MoreVert}
          accessibilityLabel={t("template.entrySeeMore", { name: props.title })}
          onPress={() => presentTrackSheet(id)}
          disabled={props.disabled}
        />
      }
      wrapperClassName={cn("bg-canvas", className)}
      poppyLabel={showIndicator}
      LeftElement={overriddenLeftElement}
      {...props}
    />
  );
}
//#endregion

//#region useTrackListPlayingIndication
/** Mark the track that's currently being played in the data. */
export function useTrackListPlayingIndication<T extends Track.Content>(
  listSource: PlayListSource,
  tracks?: T[],
): Array<T & { showIndicator?: boolean }> | undefined {
  const currSource = useMusicStore((state) => state.playingSource);
  const activeId = useMusicStore((state) => state.activeId);
  const isQueuedTrack = useMusicStore((state) => state.isInQueue);

  const passPreCheck = useMemo(
    () => arePlaybackSourceEqual(currSource, listSource) && !isQueuedTrack,
    [currSource, isQueuedTrack, listSource],
  );

  return useMemo(() => {
    if (!passPreCheck || !tracks || !activeId) return tracks;
    return tracks.map((t) => {
      if (t.id !== activeId) return t;
      return { ...t, showIndicator: true };
    });
  }, [passPreCheck, activeId, tracks]);
}
//#endregion

//#region useTrackListPreset
/** Presets used to render a list of `<Track />`. */
export function useTrackListPreset(props: {
  data?: readonly Track.Content[];
  trackSource: PlayListSource;
  isPending?: boolean;
}) {
  // @ts-expect-error - Readonly is fine.
  const data = useTrackListPlayingIndication(props.trackSource, props.data);
  return useMemo(
    () => ({
      estimatedItemSize: 56, // 48px Height + 8px Margin Top
      data,
      keyExtractor: ({ id }) => id,
      renderItem: ({ item, index }) => (
        <Track
          {...item}
          trackSource={props.trackSource}
          className={index > 0 ? "mt-2" : undefined}
        />
      ),
      ListEmptyComponent: (
        <ContentPlaceholder
          isPending={props.isPending}
          errMsgKey="err.msg.noTracks"
        />
      ),
    }),
    [props, data],
  ) satisfies FlashListProps<Track.Content>;
}
//#endregion
