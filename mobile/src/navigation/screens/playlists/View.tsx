// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { usePlaylists } from "~/data/playlist/queries";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { useViewOrder } from "~/stores/ViewPreference/hooks/useViewOrder";
import type { LayoutItem } from "~/stores/ViewPreference/types";

import * as LibraryLayout from "~/navigation/layouts/LibrayLayout";
import { PlaylistsViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import type { ExtractQueryData } from "~/lib/react-query";
import { FilledIconButton } from "~/components/Form/Button/Icon";

type PlaylistData = ExtractQueryData<typeof usePlaylists>[number];

export default function Playlists() {
  const asGrid = useViewPreferenceStore((s) => s.playlistLayout !== "list");
  return (
    <LibraryLayout.Provider asGrid={asGrid}>
      <LibraryLayout.Header
        titleKey="term.playlists"
        Actions={<PlaylistActions />}
        OptionsSheet={PlaylistsViewOptionsSheet}
      />
      <ScreenContents />
    </LibraryLayout.Provider>
  );
}

function PlaylistActions() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <FilledIconButton
      icon="add"
      accessibilityLabel={t("form.create")}
      onPress={() => navigation.navigate("CreatePlaylist")}
      theme="primary"
    />
  );
}

function ScreenContents() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isPending, data } = usePlaylists();

  const sortedData = useViewOrder("playlist", data);
  const formatData = useCallback(
    (item: PlaylistData) => ({
      id: item.name,
      title: item.name,
      description: t("plural.track", { count: item.trackCount }),
      imageSource: item.artwork,
    }),
    [t],
  );

  const splittedData = useMemo(() => {
    const favorites: LayoutItem[] = [];
    const nonFavorites: LayoutItem[] = [];
    sortedData?.forEach((playlist) => {
      if (playlist.isFavorite) favorites.push(formatData(playlist));
      else nonFavorites.push(formatData(playlist));
    });
    return { favorites, nonFavorites };
  }, [sortedData, formatData]);

  return (
    <LibraryLayout.MediaList
      data={splittedData.nonFavorites}
      onPress={(id) => navigation.navigate("Playlist", { id })}
      ListHeaderComponent={
        <LibraryLayout.FavoriteMedia
          data={splittedData.favorites}
          onPress={(id) => navigation.navigate("Playlist", { id })}
        />
      }
      ListEmptyComponent={
        <ContentPlaceholder
          isPending={isPending || sortedData === undefined}
          errMsgKey="err.msg.noPlaylists"
          className="absolute inset-0 pt-safe-offset-36"
        />
      }
    />
  );
}
