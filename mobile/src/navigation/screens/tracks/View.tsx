// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { ScopedTheme } from "uniwind";

import { usePlaylist } from "~/data/playlist/queries";
import { useSortedTracks } from "~/data/track/queries";
import { useDelayedReady } from "~/hooks/useDelayedReady";

import * as LibraryLayout from "~/navigation/layouts/LibraryLayout";
import { TracksViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { getImageUri } from "~/lib/file-system";
import { Icon } from "~/components/next/base/icon";
import { Ripple } from "~/components/next/base/ripple";
import { createTextStack } from "~/components/next/blocks/text-stack";
import { TrackItem } from "~/components/next/composed/track-item";
import { Image } from "~/components/next/primitive/image";
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
  labelConfig: { size: "sm" },
  supportingConfig: { muted: true },
  clampText: true,
});

function FavoritesPlaylistLink() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { data } = usePlaylist(FavoritesPlaylistKey);

  return (
    <ScopedTheme theme="atmosphere">
      <Ripple
        onPress={() =>
          navigation.navigate("Playlist", { id: FavoritesPlaylistKey })
        }
        className="relative mx-0.5 mb-4 min-h-14 flex-row items-center gap-5 rounded-lg bg-surfaceContainerHigh px-3"
      >
        <Image
          source={getImageUri(
            Array.isArray(data?.artwork) ? data.artwork[0] : data?.artwork,
          )}
          blurRadius={10}
          // @ts-expect-error - Brightness prop works.
          style={{ filter: [{ brightness: "75%" }] }}
          className="absolute inset-0"
        />

        <Icon name="favorite-filled" size={32} />
        <CustomTextStack
          label={t("term.favoriteTracks")}
          supporting={t("plural.track", { count: data?.tracks.length ?? 0 })}
        />
        <View className="ltr:rotate-180">
          <Icon name="arrow-back" size={32} />
        </View>
      </Ripple>
    </ScopedTheme>
  );
}
//#endregion
