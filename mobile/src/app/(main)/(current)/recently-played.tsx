import { useIsFocused } from "@react-navigation/native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { RECENT_DAY_RANGE } from "~/api/recent";
import { queries as q } from "~/queries/keyStore";
import {
  useRecentlyPlayedMediaLists,
  useRecentlyPlayedTracks,
} from "~/queries/recent";
import { useBottomActionsContext } from "~/hooks/useBottomActionsContext";
import { useGetColumn } from "~/hooks/useGetColumn";

import { queryClient } from "~/lib/react-query";
import { FlashList } from "~/components/Defaults";
import { PagePlaceholder } from "~/components/Transition/Placeholder";
import { ReservedPlaylists } from "~/modules/media/constants";
import { MediaCard } from "~/modules/media/components/MediaCard";
import { Track } from "~/modules/media/components/Track";

// Information about this track list.
const trackSource = {
  type: "playlist",
  id: ReservedPlaylists.tracks,
} as const;

/** Screen for `/recently-played` route. */
export default function RecentlyPlayedScreen() {
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const { bottomInset } = useBottomActionsContext();
  const recentlyPlayedMediaLists = useRecentlyPlayedMediaLists();
  const recentlyPlayedTracks = useRecentlyPlayedTracks();

  const isAwaitingContent =
    recentlyPlayedMediaLists.isPending && recentlyPlayedTracks.isPending;
  const hasNoContent =
    recentlyPlayedMediaLists.data?.length === 0 &&
    recentlyPlayedTracks.data?.length === 0;

  useEffect(() => {
    if (isFocused) {
      queryClient.invalidateQueries({
        predicate: ({ queryKey }) =>
          queryKey === q.recent.mediaLists.queryKey ||
          queryKey === q.recent.tracks.queryKey,
      });
    }
  }, [isFocused]);

  if (isAwaitingContent || hasNoContent) {
    return (
      <PagePlaceholder
        isPending={isAwaitingContent}
        errMsg={t("feat.playedRecent.extra.notFound", {
          amount: RECENT_DAY_RANGE,
        })}
      />
    );
  }

  return (
    <FlashList
      estimatedItemSize={56} // 48px Height + 8px Margin Top
      data={recentlyPlayedTracks.data}
      keyExtractor={({ id }) => id}
      renderItem={({ item, index }) => (
        <Track
          {...item}
          trackSource={trackSource}
          className={index > 0 ? "mt-2" : undefined}
        />
      )}
      ListHeaderComponent={
        <RecentlyPlayedLists data={recentlyPlayedMediaLists.data} />
      }
      contentContainerClassName="px-4 pt-4"
      contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 16 }}
    />
  );
}

function RecentlyPlayedLists(props: { data?: MediaCard.Content[] }) {
  const { width } = useGetColumn({
    cols: 1,
    gap: 0,
    gutters: 32,
    minWidth: 100,
  });
  if (props.data?.length === 0) return null;
  return (
    <FlashList
      estimatedItemSize={width + 12} // Column width + gap from padding left
      horizontal
      data={props.data}
      keyExtractor={({ href }) => href}
      renderItem={({ item, index }) => (
        <MediaCard
          {...item}
          size={width}
          className={index > 0 ? "ml-3" : undefined}
        />
      )}
      className="-mx-4"
      contentContainerClassName="px-4 pb-6"
    />
  );
}
