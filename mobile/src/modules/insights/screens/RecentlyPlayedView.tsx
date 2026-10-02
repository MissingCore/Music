// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import {
  useHorizontalListLayoutConfig,
  useListLayoutConfig,
} from "~/hooks/useLayoutConfigs";

import { getMediaLinkContext } from "~/navigation/utils/router";
import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";
import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { LegendList } from "~/components/Base/LegendList";
import { FlatList } from "~/components/Base/List";
import { ImageCard } from "~/components/next/composed/image-card";
import {
  TrackItem,
  TrackListContext,
} from "~/components/next/composed/track-item";
import { ReservedPlaylists } from "~/modules/media/constants";
import { RECENT_DAY_RANGE } from "../core/constants";
import type { RecentListCardContent } from "../core/RecentContentQuerier";
import { useRecentlyPlayedMedia } from "../core/RecentContentQuerier";

// Information about this track list.
const trackSource = {
  type: "playlist",
  id: ReservedPlaylists.tracks,
} as const;

export default function RecentlyPlayed() {
  const { t } = useTranslation();
  const bottomOffset = useBottomActionsOffset();
  const { isPending, error, data } = useRecentlyPlayedMedia();
  const listLayout = useListLayoutConfig();

  const hasNoContent = data?.lists?.length === 0 && data?.tracks?.length === 0;

  if (isPending || error || hasNoContent) {
    return (
      <PagePlaceholder
        isPending={isPending}
        errMsg={t("feat.recent.extra.recentlyPlayedNone", {
          amount: RECENT_DAY_RANGE,
        })}
      />
    );
  }

  return (
    <TrackListContext value={trackSource}>
      <LegendList
        numColumns={listLayout.count}
        estimatedItemSize={62} // 56px Height + 6px Margin Bottom
        data={data?.tracks}
        keyExtractor={({ id }) => id}
        renderItem={({ item }) => <TrackItem {...item} />}
        ListHeaderComponent={<RecentlyPlayedLists data={data.lists} />}
        className="-mx-0.75 -mb-1.5"
        contentContainerClassName="p-4"
        contentContainerStyle={{ paddingBottom: bottomOffset }}
      />
    </TrackListContext>
  );
}

function RecentlyPlayedLists(props: { data?: RecentListCardContent[] }) {
  const navigation = useNavigation();
  const { width } = useHorizontalListLayoutConfig();

  if (props.data?.length === 0) return null;
  return (
    <FlatList
      horizontal
      data={props.data}
      keyExtractor={({ id, type }) => `${type}_${id}`}
      renderItem={({ item }) => (
        <ImageCard
          src={item.src}
          size={width}
          label={item.title}
          supporting={item.description}
          onPress={() => {
            const linkInfo = getMediaLinkContext(item);
            // @ts-expect-error - The following is valid.
            if (linkInfo[0] === "HomeScreens") navigation.popTo(...linkInfo);
            else navigation.navigate(...linkInfo);
          }}
          spacing="none"
        />
      )}
      className="-mx-3.25"
      contentContainerClassName="gap-1.5 p-4 pt-0"
    />
  );
}
