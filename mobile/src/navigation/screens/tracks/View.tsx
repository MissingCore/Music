// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useFavoriteTracksCount } from "~/data/favorite/queries";
import { useSortedTracks } from "~/data/track/queries";
import { useDelayedReady } from "~/hooks/useDelayedReady";

import * as LibraryLayout from "~/navigation/layouts/LibraryLayout";
import { TracksViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { Icon } from "~/components/next/base/icon";
import { Ripple } from "~/components/next/base/ripple";
import { createTextStack } from "~/components/next/blocks/text-stack";
import { TrackItem } from "~/components/next/composed/track-item";
import {
  FavoritesPlaylistKey,
  ReservedPlaylists,
} from "~/modules/media/constants";
import {
  RepeatButton,
  ShuffleButton,
} from "~/modules/media/components/MediaControls";
import { PlayMediaListButton } from "~/modules/media/components/MediaListControls";
import { useTrackListPlayingIndication } from "~/modules/media/components/Track";

// Information about this track list.
const trackSource = {
  type: "playlist",
  id: ReservedPlaylists.tracks,
} as const;

export default function Tracks() {
  return (
    <LibraryLayout.Provider asGrid={false}>
      <LibraryLayout.Header
        titleKey="term.tracks"
        Actions={<TrackActions />}
        OptionsSheet={TracksViewOptionsSheet}
      />
      <ScreenContents />
    </LibraryLayout.Provider>
  );
}

function TrackActions() {
  return (
    <>
      <PlayMediaListButton trackSource={trackSource} />
      <RepeatButton size="sm" />
      <ShuffleButton size="sm" />
    </>
  );
}

function ScreenContents() {
  //? Defer query to enable the header to mount (as the query will block
  //? the JS thread if the user has lots of tracks).
  const isReady = useDelayedReady(1);
  const { isPending, data } = useSortedTracks(isReady);

  const formattedData = useMemo(
    () =>
      data?.map((t) => ({
        id: t.id,
        imageSource: t.artwork,
        title: t.name,
        description: t.artistName ?? "—",
      })),
    [data],
  );
  const listData = useTrackListPlayingIndication(trackSource, formattedData);

  const renderItem = useCallback<
    LibraryLayout.MediaListRenderItem<NonNullable<typeof listData>[number]>
  >(({ item }) => <TrackItem {...item} trackSource={trackSource} />, []);

  return (
    <LibraryLayout.MediaList
      data={listData}
      keyExtractor={({ id }) => id}
      renderItem={renderItem}
      ListHeaderComponent={<FavoritesPlaylistLink />}
      ListEmptyComponent={
        <ContentPlaceholder
          isPending={isPending}
          className="absolute inset-0 pt-safe-offset-48"
        />
      }
    />
  );
}

//#region Favorite Tracks Link
const CustomTextStack = createTextStack({
  labelConfig: { intent: "primary", size: "sm" },
  supportingConfig: { intent: "primary", muted: true },
  clampText: true,
});

function FavoritesPlaylistLink() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { data } = useFavoriteTracksCount();

  return (
    <Ripple
      rippleColor="primaryDim"
      onPress={() =>
        navigation.navigate("Playlist", { id: FavoritesPlaylistKey })
      }
      className="mx-0.5 mb-4 flex-row items-center gap-2 rounded-lg bg-primary"
    >
      <View className="size-14 items-center justify-center">
        <Icon name="favorite-filled" size={32} color="onPrimary" />
      </View>
      <CustomTextStack
        label={t("term.favoriteTracks")}
        supporting={t("plural.track", { count: data ?? 0 })}
      />
      <View className="mr-2 size-10 items-center justify-center rounded-full bg-onPrimary ltr:rotate-180">
        <Icon name="arrow-back" size={32} color="primary" />
      </View>
    </Ripple>
  );
}
//#endregion
