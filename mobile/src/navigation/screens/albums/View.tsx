// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";

import { useAlbums } from "~/data/album/queries";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useSessionStore } from "~/stores/Session/store";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { useViewOrder } from "~/stores/ViewPreference/hooks/useViewOrder";
import type { LayoutItem } from "~/stores/ViewPreference/types";

import * as LibraryLayout from "~/navigation/layouts/LibrayLayout";
import { AlbumsViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import type { ExtractQueryData } from "~/lib/react-query";

type AlbumData = ExtractQueryData<typeof useAlbums>[number];

function formatData({ id, name, artistName, artwork }: AlbumData) {
  return { id, title: name, description: artistName, imageSource: artwork };
}

export default function Albums() {
  const asGrid = useViewPreferenceStore((s) => s.albumLayout !== "list");
  return (
    <LibraryLayout.Provider asGrid={asGrid}>
      <LibraryLayout.Header
        titleKey="term.albums"
        OptionsSheet={AlbumsViewOptionsSheet}
      />
      <ScreenContents />
    </LibraryLayout.Provider>
  );
}

function ScreenContents() {
  const navigation = useNavigation();
  const { isPending, data } = useAlbums();
  const minAlbumLength = usePreferenceStore((s) => s.minAlbumLength);
  const showSingles = useSessionStore((s) => s.showSingles);
  const showEPs = useSessionStore((s) => s.showEPs);
  const showAlbums = useSessionStore((s) => s.showAlbums);

  const filteredData = useMemo(
    () =>
      data?.filter(({ isEP, trackCount }) => {
        let condition = trackCount >= minAlbumLength;
        if (!showSingles) condition &&= trackCount > 1;
        if (!showEPs) condition &&= !isEP;
        if (!showAlbums) condition &&= trackCount === 1 || isEP;
        return condition;
      }),
    [data, minAlbumLength, showSingles, showEPs, showAlbums],
  );

  const sortedData = useViewOrder("album", filteredData);

  const splittedData = useMemo(() => {
    const favorites: LayoutItem[] = [];
    const nonFavorites: LayoutItem[] = [];
    sortedData?.forEach((album) => {
      if (album.isFavorite) favorites.push(formatData(album));
      else nonFavorites.push(formatData(album));
    });
    return { favorites, nonFavorites };
  }, [sortedData]);

  return (
    <LibraryLayout.MediaList
      data={splittedData.nonFavorites}
      onPress={(id) => navigation.navigate("Album", { id })}
      ListHeaderComponent={
        <LibraryLayout.FavoriteMedia
          data={splittedData.favorites}
          onPress={(id) => navigation.navigate("Album", { id })}
        />
      }
      ListEmptyComponent={
        splittedData.favorites.length === 0 ? (
          <ContentPlaceholder
            isPending={isPending || sortedData === undefined}
            errMsgKey="err.msg.noAlbums"
            className="absolute inset-0 pt-safe-offset-36"
          />
        ) : undefined
      }
    />
  );
}
