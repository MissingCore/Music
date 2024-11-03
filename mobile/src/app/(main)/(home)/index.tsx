import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import { albums, playlists } from "@/db/schema";
import { getAlbums, getPlaylists, getSpecialPlaylist } from "@/db/queries";
import { formatForMediaCard } from "@/db/utils/formatters";

import { useGetColumn } from "@/hooks/useGetColumn";
import { useMusicStore } from "@/modules/media/services/Music";
import { StickyActionLayout } from "@/layouts";

import { favoriteKeys } from "@/constants/QueryKeys";
import { abbreviateNum } from "@/utils/number";
import { Button } from "@/components/new/Form";
import { AccentText, StyledText } from "@/components/new/Typography";
import { ReservedPlaylists } from "@/modules/media/constants";
import {
  MediaCard,
  MediaCardList,
  MediaCardPlaceholderContent,
} from "@/modules/media/components";

/** Screen for `/` route. */
export default function HomeScreen() {
  const { t } = useTranslation();
  return (
    <StickyActionLayout title={t("header.home")}>
      <StyledText className="-mb-4 text-xs">
        {t("home.playedRecent")}
      </StyledText>
      <RecentlyPlayed />

      <StyledText className="-mb-4 text-xs">{t("home.favorites")}</StyledText>
      <Favorites />
    </StickyActionLayout>
  );
}

//#region Recently Played List
/** Display list of media recently played. */
function RecentlyPlayed() {
  const { t } = useTranslation();
  const { width } = useGetColumn({
    ...{ cols: 1, gap: 0, gutters: 32, minWidth: 100 },
  });
  const recentlyPlayedData = useMusicStore((state) => state.recentList);

  const [initNoData, setInitNoData] = useState(false);
  const [itemHeight, setItemHeight] = useState(0);
  const listRef = useRef<FlashList<MediaCard.Content>>(null);

  useEffect(() => {
    // Fix incorrect `<FlashList />` height due to it only being calculated
    // on initial render.
    //  - See: https://github.com/Shopify/flash-list/issues/881
    if (initNoData && itemHeight !== 0) {
      // @ts-ignore: Bypass private property access warning
      listRef.current?.rlvRef?._onSizeChanged({
        // @ts-ignore: Bypass private property access warning
        width: listRef.current.rlvRef._layout.width,
        height: itemHeight,
      });
      setInitNoData(false);
    }
  }, [initNoData, itemHeight]);

  return (
    <FlashList
      ref={listRef}
      estimatedItemSize={width + 16} // Column width + gap from padding left
      horizontal
      data={recentlyPlayedData}
      keyExtractor={({ href }) => href}
      renderItem={({ item, index }) => (
        <View
          onLayout={(e) => setItemHeight(e.nativeEvent.layout.height)}
          className={index !== 0 ? "pl-4" : ""}
        >
          <MediaCard {...item} size={width} />
        </View>
      )}
      showsHorizontalScrollIndicator={false}
      ListEmptyComponent={
        <StyledText onLayout={() => setInitNoData(true)} className="my-4">
          {t("response.noRecents")}
        </StyledText>
      }
      className="-mx-4"
      contentContainerClassName="px-4"
    />
  );
}
//#endregion

//#region Favorites
/** Display list of content we've favorited. */
function Favorites() {
  const { data } = useFavoriteListsForMediaCard();
  return (
    <MediaCardList
      data={[MediaCardPlaceholderContent, ...(data ?? [])]}
      RenderFirst={FavoriteTracks}
    />
  );
}

/**
 * Displays the number of favorited tracks and opens up the playlist of
 * favorited tracks.
 */
function FavoriteTracks({ size }: { size: number }) {
  const { t } = useTranslation();
  const { isPending, error, data } = useFavoriteTracksCount();

  const trackCount = isPending || error ? "" : abbreviateNum(data);

  return (
    <Button
      onPress={() =>
        router.navigate(`/playlist/${ReservedPlaylists.favorites}`)
      }
      style={{ width: size, height: size }}
      className="gap-0 rounded-lg bg-red"
    >
      <AccentText className="text-[3rem] text-neutral100">
        {trackCount}
      </AccentText>
      <StyledText className="text-neutral100">{t("common.tracks")}</StyledText>
    </Button>
  );
}
//#endregion

//#region Data
async function getFavoriteLists() {
  const [favoriteAlbums, favoritePlaylists] = await Promise.all([
    getAlbums([eq(albums.isFavorite, true)]),
    getPlaylists([eq(playlists.isFavorite, true)]),
  ]);
  return { albums: favoriteAlbums, playlists: favoritePlaylists };
}

const useFavoriteTracksCount = () =>
  useQuery({
    queryKey: favoriteKeys.tracks(),
    queryFn: () => getSpecialPlaylist(ReservedPlaylists.favorites),
    staleTime: Infinity,
    select: (data) => data.tracks.length,
  });

const useFavoriteListsForMediaCard = () =>
  useQuery({
    queryKey: favoriteKeys.lists(),
    queryFn: getFavoriteLists,
    staleTime: Infinity,
    select: (data) =>
      [
        ...data.albums.map((album) =>
          formatForMediaCard({ type: "album", data: album }),
        ),
        ...data.playlists.map((playlist) =>
          formatForMediaCard({ type: "playlist", data: playlist }),
        ),
      ].sort((a, b) => a.title.localeCompare(b.title)),
  });
//#endregion
