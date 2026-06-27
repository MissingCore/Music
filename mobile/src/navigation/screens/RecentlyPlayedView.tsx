// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { RECENT_DAY_RANGE } from "~/data/recent/api";
import { useRecentlyPlayedMedia } from "~/data/recent/queries";
import { useGetColumn } from "~/hooks/useGetColumn";

import { getMediaLinkContext } from "../utils/router";
import { useBottomActionsOffset } from "../components/BottomActions/useBottomActions";
import { PagePlaceholder } from "../components/Placeholder";

import { FlatList, getListItemLayout } from "~/components/Base/List";
import { ReservedPlaylists } from "~/modules/media/constants";
import { MediaCard } from "~/modules/media/components/MediaCard";
import type { MediaCardContent } from "~/modules/media/components/MediaCard.type";
import { Track } from "~/modules/media/components/Track";

// Information about this track list.
const trackSource = {
  type: "playlist",
  id: ReservedPlaylists.tracks,
} as const;

export default function RecentlyPlayed() {
  const { t } = useTranslation();
  const bottomOffset = useBottomActionsOffset(16);
  const { isPending, error, data } = useRecentlyPlayedMedia();

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
    <FlatList
      data={data.tracks}
      keyExtractor={({ id }) => id}
      renderItem={({ item }) => (
        <Track {...item} trackSource={trackSource} className="mb-2" />
      )}
      getItemLayout={getListItemLayout}
      ListHeaderComponent={<RecentlyPlayedLists data={data.lists} />}
      className="-mb-2"
      contentContainerClassName="px-4 pt-4"
      contentContainerStyle={{ paddingBottom: bottomOffset }}
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
          className={index > 0 ? "ml-3" : undefined}
        />
      )}
      className="-mx-4"
      contentContainerClassName="px-4 pb-6"
    />
  );
}
