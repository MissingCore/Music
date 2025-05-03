import type { FlashListProps } from "@shopify/flash-list";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SheetManager } from "react-native-actions-sheet";

import { MoreVert } from "~/icons/MoreVert";
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
          onPress={() => SheetManager.show("TrackSheet", { payload: { id } })}
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
