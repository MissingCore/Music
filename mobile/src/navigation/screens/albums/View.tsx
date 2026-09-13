// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useAlbums } from "~/data/album/queries";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useSessionStore } from "~/stores/Session/store";
import { useViewOrder } from "~/stores/ViewPreference/hooks/useViewOrder";
import {
  useCompactGridLayoutConfig,
  useGridLayoutConfig,
  useListLayoutConfig,
} from "~/hooks/useLayoutConfigs";

import { AlbumsViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";

import type { ExtractQueryData } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { LegendList } from "~/components/Base/LegendList";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { Marquee } from "~/components/Marquee";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import {
  getLargeImageCardHeight,
  ImageCard,
  LargeImageCard,
} from "~/components/next/composed/image-card";
import { ImageListItem } from "~/components/next/composed/image-list-item";
import { TText } from "~/components/next/base/typography";
import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";

export default function Albums() {
  const { data } = useAlbums();
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
    const favorites: AlbumData[] = [];
    const nonFavorites: AlbumData[] = [];
    sortedData?.forEach((album) => {
      if (album.isFavorite) favorites.push(album);
      else nonFavorites.push(album);
    });
    return { favorites, nonFavorites };
  }, [sortedData]);

  const forGrid = useViewPreferenceStore((s) => s.albumLayout !== "list");

  return (
    <>
      <LibraryHeader />
      <LibraryMedia
        data={splittedData.nonFavorites}
        favoritesData={splittedData.favorites}
        forGrid={forGrid}
      />
    </>
  );
}

function LibraryHeader() {
  const { t } = useTranslation();
  const sheetRef = useSheetRef();

  return (
    <>
      <AlbumsViewOptionsSheet ref={sheetRef} />
      <View className="flex-row items-center justify-between px-4 pt-safe-offset-8 pb-2">
        <Marquee>
          <TText textKey="term.albums" intent="accent" size="4xl" />
        </Marquee>
        <FilledIconButton
          icon="more-horiz"
          accessibilityLabel={t("feat.modalViewPreference.title")}
          onPress={() => sheetRef.current?.present()}
        />
      </View>
    </>
  );
}

function LibraryMedia(props: {
  data: AlbumData[];
  favoritesData?: AlbumData[];
  forGrid?: boolean;
}) {
  const navigation = useNavigation();
  const listLayout = useListLayoutConfig();
  const compactGridLayout = useCompactGridLayoutConfig();
  const config = props.forGrid ? compactGridLayout : listLayout;

  const Wrapper = props.forGrid ? ImageCard : ImageListItem;

  const showNavbar = usePreferenceStore((s) => s.showNavbar);
  const bottomOffset = useBottomActionsOffset({
    maxRows: showNavbar ? 2 : 1,
    rowAlwaysVisible: true,
  });

  return (
    <LegendList
      numColumns={config.count}
      data={props.data}
      estimatedItemSize={config.width + 4}
      renderItem={({ item }) => (
        <Wrapper
          src={item.artwork}
          size={config.width}
          label={item.name}
          supporting={!props.forGrid ? item.artistName : undefined}
          onPress={() => navigation.navigate("Album", { id: item.id })}
          className={cn("mx-0.5 mb-1", !props.forGrid && "pr-4")}
        />
      )}
      ListHeaderComponent={
        <FavoriteMedia data={props.favoritesData} forGrid={props.forGrid} />
      }
      className="-mx-0.5 -mb-1"
      contentContainerStyle={{ paddingBottom: bottomOffset }}
      contentContainerClassName="p-4"
    />
  );
}

function FavoriteMedia(props: { data?: AlbumData[]; forGrid?: boolean }) {
  const navigation = useNavigation();
  const gridLayout = useGridLayoutConfig();
  const compactGridLayout = useCompactGridLayoutConfig();
  const config = props.forGrid ? gridLayout : compactGridLayout;

  const estimatedItemSize = props.forGrid
    ? getLargeImageCardHeight(config.width)
    : config.width;
  const Wrapper = props.forGrid ? LargeImageCard : ImageCard;

  if (!props.data || props.data.length === 0) return undefined;
  return (
    <LegendList
      numColumns={config.count}
      data={props.data}
      estimatedItemSize={estimatedItemSize + 4}
      renderItem={({ item }) => (
        <Wrapper
          src={item.artwork}
          size={config.width}
          label={item.name}
          supporting={item.artistName}
          onPress={() => navigation.navigate("Album", { id: item.id })}
          className="mx-0.5 mb-1"
        />
      )}
      scrollEnabled={false}
      className="-mx-0.5 -mb-1"
      contentContainerClassName="pb-4"
    />
  );
}

//#region Utils
type AlbumData = ExtractQueryData<typeof useAlbums>[number];
//#endregion
