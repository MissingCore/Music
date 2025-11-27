import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { RECENT_DAY_RANGE } from "~/api/recent";
import { queries as q } from "~/queries/keyStore";
import {
  useRecentlyPlayedMediaLists,
  useRecentlyPlayedTracks,
} from "~/queries/recent";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useGetColumn } from "~/hooks/useGetColumn";
import { useBottomActionsInset } from "../hooks/useBottomActions";
import { getMediaLinkContext } from "../utils/router";

import { OnRTL } from "~/lib/react";
import { queryClient } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { LegendList } from "~/components/Defaults";
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
      estimatedItemSize={56}
      data={recentlyPlayedTracks.data}
      keyExtractor={({ id }) => id}
      renderItem={({ item }) => <Track {...item} trackSource={trackSource} />}
      ListHeaderComponent={
        <RecentlyPlayedLists data={recentlyPlayedMediaLists.data} />
      }
      contentContainerClassName="gap-2 px-4 pt-4"
      contentContainerStyle={{ paddingBottom: bottomInset.onlyPlayer + 8 }}
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
  const primaryFont = usePreferenceStore((s) => s.primaryFont);

  const listHeight = useMemo(
    () => width + (primaryFont === "Inter" ? 42 : 39) + 24,
    [primaryFont, width],
  );

  if (props.data?.length === 0) return null;
  return (
    <LegendList
      estimatedItemSize={width + 12} // Column width + gap from padding left
      horizontal
      data={props.data}
      keyExtractor={({ id, type }) => `${type}_${id}`}
      renderItem={({ item }) => (
        <MediaCard
          {...item}
          size={width}
          onPress={() => {
            const linkInfo = getMediaLinkContext(item);
            // @ts-expect-error - The following is valid.
            if (linkInfo[0] === "HomeScreens") navigation.popTo(...linkInfo);
            else navigation.navigate(...linkInfo);
          }}
        />
      )}
      style={{ height: listHeight }}
      className={cn("-mx-4", OnRTL.decide("-ml-7", "-mr-7"))}
      contentContainerClassName="gap-3 px-4 pb-6"
    />
  );
}
