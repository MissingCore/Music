import type { LegendListProps } from "@legendapp/list";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { MoreVert } from "~/icons/MoreVert";
import { presentTrackSheet } from "~/services/SessionStore";
import { playFromMediaList } from "../services/Playback";
import type { PlayListSource } from "../types";

import { cn } from "~/lib/style";
import type { Prettify } from "~/utils/types";
import type { PressProps } from "~/components/Form/Button";
import { IconButton } from "~/components/Form/Button";
import { ContentPlaceholder } from "~/components/Transition/Placeholder";
import { SearchResult } from "~/modules/search/components/SearchResult";

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
export function Track({ id, trackSource, className, ...props }: Track.Props) {
  const { t } = useTranslation();
  return (
    <SearchResult
      as="ripple"
      type="track"
      onPress={() => playFromMediaList({ trackId: id, source: trackSource })}
      RightElement={
        <IconButton
          kind="ripple"
          accessibilityLabel={t("template.entrySeeMore", { name: props.title })}
          onPress={() => presentTrackSheet(id)}
          disabled={props.disabled}
        >
          <MoreVert />
        </IconButton>
      }
      wrapperClassName={cn("bg-canvas", className)}
      {...props}
    />
  );
}
//#endregion

//#region Track List
type TrackListProps = {
  data?: readonly Track.Content[];
  trackSource: PlayListSource;
  isPending?: boolean;
};

/** Presets used in the FlashList containing a list of `<Track />`. */
export function useTrackListPreset(props: TrackListProps) {
  return useMemo(
    () => ({
      estimatedItemSize: 56, // +8px to prevent gap not being initially applied when data changes.
      data: props.data,
      keyExtractor: ({ id }) => id,
      renderItem: ({ item }) => (
        <Track {...item} trackSource={props.trackSource} />
      ),
      ListEmptyComponent: (
        <ContentPlaceholder
          isPending={props.isPending}
          errMsgKey="err.msg.noTracks"
        />
      ),
      columnWrapperStyle: { rowGap: 8 },
    }),
    [props],
  ) satisfies LegendListProps<Track.Content>;
}
//#endregion
