import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { RECENT_DAY_RANGE } from "~/api/recent";
import { queries as q } from "~/queries/keyStore";
import {
  useRecentlyPlayedMediaLists,
  useRecentlyPlayedTracks,
} from "~/queries/recent";
import { useGetColumn } from "~/hooks/useGetColumn";
import { useBottomActionsInset } from "../hooks/useBottomActions";
import { getMediaLinkContext } from "../utils/router";

import { OnRTL } from "~/lib/react";
import { queryClient } from "~/lib/react-query";
import { FlashList, LegendList } from "~/components/Defaults";
import { ReservedPlaylists } from "~/modules/media/constants";
import { MediaCard } from "~/modules/media/components/MediaCard";
import type { MediaCardContent } from "~/modules/media/components/MediaCard.type";
import { Track } from "~/modules/media/components/Track";
import { PagePlaceholder } from "../components/Placeholder";

// Information about this track list.
const trackSource = {
  type: "playlist",
  id: ReservedPlaylists.tracks,
} as const;

export default function RecentlyPlayed() {
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const bottomInset = useBottomActionsInset();
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
    <LegendList
      getEstimatedItemSize={(index) => (index === 0 ? 48 : 56)}
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

function RecentlyPlayedLists(props: { data?: MediaCardContent[] }) {
  const navigation = useNavigation();
  const { width } = useGetColumn({
    cols: 1,
    gap: 0,
    gutters: 32,
    minWidth: 100,
  });

  if (props.data?.length === 0) return null;
  return (
    <FlashList
      horizontal
      data={props.data}
      keyExtractor={({ id, type }) => `${type}_${id}`}
      renderItem={({ item, index }) => (
        <MediaCard
          {...item}
          size={width}
          onPress={() => {
            const linkInfo = getMediaLinkContext(item);
            // @ts-expect-error - The following is valid.
            if (linkInfo[0] === "HomeScreens") navigation.popTo(...linkInfo);
            else navigation.navigate(...linkInfo);
          }}
          className={index > 0 ? OnRTL.decide("mr-3", "ml-3") : undefined}
        />
      )}
      className="-mx-4"
      contentContainerClassName="px-4 pb-6"
    />
  );
}
