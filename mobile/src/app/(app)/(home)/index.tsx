import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";

import {
  useFavoriteListsForMediaCard,
  useFavoriteTracksCount,
} from "@/api/favorites";
import { useGetColumn } from "@/hooks/useGetColumn";
import { useMusicStore } from "@/modules/media/services/Music";
import { StickyActionLayout } from "@/layouts/StickyActionLayout";

import { abbreviateNum } from "@/utils/number";
import { Button } from "@/components/new/Form";
import { AccentText, StyledText } from "@/components/new/Typography";
import { ReservedPlaylists } from "@/modules/media/constants/ReservedNames";

import { MediaCard, PlaceholderContent } from "@/components/media/card";

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
  const { width, count } = useGetColumn({
    ...{ cols: 2, gap: 16, gutters: 32, minWidth: 175 },
  });

  return (
    <FlashList
      numColumns={count}
      estimatedItemSize={width + 37} // 35px `<TextStack />` Height + 2px Margin Top
      data={data ? [PlaceholderContent, ...data] : [PlaceholderContent]}
      keyExtractor={({ href }) => href}
      renderItem={({ item: data, index }) => (
        <View className="mx-2 mb-4">
          {index === 0 ? (
            <FavoriteTracks colWidth={width} />
          ) : (
            <MediaCard {...data} size={width} />
          )}
        </View>
      )}
      showsVerticalScrollIndicator={false}
      className="-m-2 mt-0"
    />
  );
}

/**
 * Displays the number of favorited tracks and opens up the playlist of
 * favorited tracks.
 */
function FavoriteTracks({ colWidth }: { colWidth: number }) {
  const { t } = useTranslation();
  const { isPending, error, data } = useFavoriteTracksCount();

  const trackCount = isPending || error ? "" : abbreviateNum(data);

  return (
    <Button
      preset="danger"
      onPress={() =>
        router.navigate(`/playlist/${ReservedPlaylists.favorites}`)
      }
      style={{ width: colWidth, height: colWidth }}
      className="items-center gap-0 rounded-lg"
    >
      <AccentText className="text-[3rem] text-neutral100">
        {trackCount}
      </AccentText>
      <StyledText className="text-neutral100">{t("common.tracks")}</StyledText>
    </Button>
  );
}
//#endregion
