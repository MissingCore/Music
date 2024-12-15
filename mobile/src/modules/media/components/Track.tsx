import type { FlashListProps } from "@shopify/flash-list";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { SheetManager } from "react-native-actions-sheet";

import { MoreVert } from "@/icons";
import { playFromMediaList } from "../services/Playback";
import type { PlayListSource } from "../types";

import { cn } from "@/lib/style";
import type { Maybe, Prettify } from "@/utils/types";
import type { WithListEmptyProps } from "@/components/Defaults";
import { useListPresets } from "@/components/Defaults";
import { IconButton } from "@/components/Form";
import { SearchResult } from "@/modules/search/components";

//#region Track
export namespace Track {
  export type Content = Required<
    Pick<SearchResult.Content, "title" | "description" | "imageSource">
  > & { id: string };

  export type Props = Prettify<
    Content & {
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
          onPress={() => SheetManager.show("track-sheet", { payload: { id } })}
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
type TrackListProps = WithListEmptyProps<{
  data: Maybe<readonly Track.Content[]>;
  trackSource: PlayListSource;
}>;

/** Presets used in the FlashList containing a list of `<Track />`. */
export function useTrackListPreset(props: TrackListProps) {
  const listPresets = useListPresets({
    isPending: props.isPending,
    emptyMsgKey: props.emptyMsgKey,
  });
  return useMemo(
    () => ({
      ...listPresets,
      estimatedItemSize: 56, // 48px Height + 8px Margin Top
      data: props.data,
      keyExtractor: ({ id }) => id,
      renderItem: ({ item, index }) => (
        <Track
          {...{ ...item, trackSource: props.trackSource }}
          className={index > 0 ? "mt-2" : undefined}
        />
      ),
    }),
    [props, listPresets],
  ) satisfies FlashListProps<Track.Content>;
}
//#endregion
