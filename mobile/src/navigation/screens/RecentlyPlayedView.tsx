// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { RECENT_DAY_RANGE } from "~/data/recent/api";
import { useRecentlyPlayedMedia } from "~/data/recent/queries";
import { useHorizontalListLayoutConfig } from "~/hooks/useLayoutConfigs";

import { getMediaLinkContext } from "../utils/router";
import { useBottomActionsOffset } from "../components/BottomActions/useBottomActions";
import { PagePlaceholder } from "../components/Placeholder";

import { LegendList } from "~/components/Base/LegendList";
import { FlatList } from "~/components/Base/List";
import { HorizontalScrollGradient } from "~/components/Gradient";
import { ReservedPlaylists } from "~/modules/media/constants";
import { MediaCard } from "~/modules/media/components/MediaCard";
import type { MediaCardContent } from "~/modules/media/components/MediaCard.type";
import { useTrackListPreset } from "~/modules/media/components/Track";

// Information about this track list.
const trackSource = {
  type: "playlist",
  id: ReservedPlaylists.tracks,
} as const;

export default function RecentlyPlayed() {
  const { t } = useTranslation();
  const bottomOffset = useBottomActionsOffset(16);
  const { isPending, error, data } = useRecentlyPlayedMedia();

  const presets = useTrackListPreset({
    data: data?.tracks,
    isPending,
    trackSource,
    contentWidthDeduction: 0,
  });

  const hasNoContent = data?.lists?.length === 0 && data?.tracks?.length === 0;

  if (isPending || error || hasNoContent) {
    return (
      <PagePlaceholder
        isPending={isPending}
        errMsg={t("feat.playedRecent.extra.notFound", {
          amount: RECENT_DAY_RANGE,
        })}
      />
    );
  }

  return (
    <LegendList
      {...presets}
      ListHeaderComponent={<RecentlyPlayedLists data={data.lists} />}
      contentContainerClassName="p-4"
      contentContainerStyle={{ paddingBottom: bottomOffset }}
    />
  );
}

function RecentlyPlayedLists(props: { data?: MediaCardContent[] }) {
  const navigation = useNavigation();
  const { width } = useHorizontalListLayoutConfig();

  if (props.data?.length === 0) return null;
  return (
    <HorizontalScrollGradient gutter={16}>
      <FlatList
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
            className={index > 0 ? "ml-2" : undefined}
          />
        )}
        contentContainerClassName="px-4 pb-6"
      />
    </HorizontalScrollGradient>
  );
}
