// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import {
  useHorizontalListLayoutConfig,
  useListLayoutConfig,
} from "~/hooks/useLayoutConfigs";

import { getMediaLinkContext } from "~/navigation/utils/router";
import { ScrollLayoutTitle } from "~/navigation/layouts/ScrollLayout";
import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";
import { PagePlaceholder } from "~/navigation/components/Placeholder";

import { cn } from "~/lib/style";
import { LegendList } from "~/components/Base/LegendList";
import { FlatList } from "~/components/Base/List";
import { ImageCard } from "~/components/next/composed/image-card";
import { ToolbarScreenOffset } from "~/components/next/composed/toolbar";
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
        ListHeaderComponent={
          <>
            <ScrollLayoutTitle title="feat.recent.extra.recentlyPlayed" />
            <RecentlyPlayedLists data={data.lists} />
          </>
        }
        className="-mx-0.75 -mb-1.5"
        contentContainerClassName={cn("p-4", ToolbarScreenOffset)}
        contentContainerStyle={{ paddingBottom: bottomOffset }}
      />
    </TrackListContext>
  );
}

function RecentlyPlayedLists(props: { data?: RecentListCardContent[] }) {
  const navigation = useNavigation("RecentlyPlayed");
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
            const [screen, config] = getMediaLinkContext(item);
            if (screen === "HomeScreens") navigation.popTo(screen, config);
            else navigation.navigate(screen, config);
          }}
          spacing="none"
        />
      )}
      className="-mx-3.25"
      contentContainerClassName="gap-1.5 px-4 py-6"
    />
  );
}
