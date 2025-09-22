import type { FlashListProps } from "@shopify/flash-list";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MoreVert } from "~/resources/icons/MoreVert";
import { presentTrackSheet } from "~/services/SessionStore";
import { useMusicStore } from "../services/Music";
import { playFromMediaList } from "../services/Playback";
import { arePlaybackSourceEqual } from "../helpers/data";
import type { PlayListSource } from "../types";

import { cn } from "~/lib/style";
import type { Prettify } from "~/utils/types";
import type { PressProps } from "~/components/Form/Button";
import { IconButton } from "~/components/Form/Button";
import { SearchResult } from "~/modules/search/components/SearchResult";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";
import { PlayingIndicator } from "./AnimatedBars";

//#region Track
export namespace Track {
  export type Content = Required<
    Pick<SearchResult.Content, "title" | "description" | "imageSource">
  > & { id: string };

  export type Props = Prettify<
    Content &
      Omit<PressProps, "onPress"> & {
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
  LeftElement,
  ...props
}: Track.Props) {
  const { t } = useTranslation();
  const [_, shouldShowIndicator] = useIsTrackPlayed(trackSource);

  const showIndicator = useMemo(
    () => shouldShowIndicator(id),
    [shouldShowIndicator, id],
  );

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

//#region useIsTrackPlayed
/** Determines if we should add a "playing" indicator for the given track. */
export function useIsTrackPlayed(listSource: PlayListSource) {
  const currSource = useMusicStore((state) => state.playingSource);
  const activeId = useMusicStore((state) => state.activeId);
  const isQueuedTrack = useMusicStore((state) => state.isInQueue);

  const passPreCheck = useMemo(
    () => arePlaybackSourceEqual(currSource, listSource) && !isQueuedTrack,
    [currSource, isQueuedTrack, listSource],
  );

  return useMemo(
    () => [passPreCheck, (id: string) => id === activeId] as const,
    [passPreCheck, activeId],
  );
}
//#endregion

//#region useTrackListPreset
/** Presets used to render a list of `<Track />`. */
export function useTrackListPreset(props: {
  data?: readonly Track.Content[];
  trackSource: PlayListSource;
  isPending?: boolean;
}) {
  return useMemo(
    () => ({
      estimatedItemSize: 56, // 48px Height + 8px Margin Top
      data: props.data,
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
    [props],
  ) satisfies FlashListProps<Track.Content>;
}
//#endregion
