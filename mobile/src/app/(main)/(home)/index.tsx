import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { ScrollView } from "react-native-gesture-handler";

import {
  useFavoriteListsForCards,
  useFavoriteTracksCount,
} from "@/queries/favorite";
import { useGetColumn } from "@/hooks/useGetColumn";
import { useRecentListStore } from "@/modules/media/services/RecentList";
import { StickyActionScrollLayout } from "@/layouts";

import { cn } from "@/lib/style";
import { abbreviateNum } from "@/utils/number";
import { Button } from "@/components/Form";
import { AccentText, Em, StyledText } from "@/components/Typography";
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
    <StickyActionScrollLayout titleKey="header.home">
      <Em className="-mb-4">{t("home.playedRecent")}</Em>
      <RecentlyPlayed />

      <Em className="-mb-4">{t("home.favorites")}</Em>
      <Favorites />
    </StickyActionScrollLayout>
  );
}

//#region Recently Played List
/** Display list of media recently played. */
function RecentlyPlayed() {
  const { t } = useTranslation();
  const { width } = useGetColumn({
    ...{ cols: 1, gap: 0, gutters: 32, minWidth: 100 },
  });
  const recentlyPlayedData = useRecentListStore((state) => state.recentList);

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
      estimatedItemSize={width + 12} // Column width + gap from padding left
      horizontal
      data={recentlyPlayedData}
      keyExtractor={({ href }) => href}
      renderItem={({ item, index }) => (
        <MediaCard
          onLayout={(e) => setItemHeight(e.nativeEvent.layout.height)}
          {...{ ...item, size: width }}
          className={index > 0 ? "ml-3" : undefined}
        />
      )}
      ListEmptyComponent={
        <StyledText onLayout={() => setInitNoData(true)} className="my-4">
          {t("response.noRecents")}
        </StyledText>
      }
      renderScrollComponent={ScrollView}
      showsHorizontalScrollIndicator={false}
      className="-mx-4"
      contentContainerClassName="px-4"
    />
  );
}
//#endregion

//#region Favorites
/** Display list of content we've favorited. */
function Favorites() {
  const { data } = useFavoriteListsForCards();
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
function FavoriteTracks(props: { size: number; className: string }) {
  const { t } = useTranslation();
  const { isPending, error, data } = useFavoriteTracksCount();

  const trackCount = isPending || error ? "" : abbreviateNum(data);

  return (
    <Button
      onPress={() =>
        router.navigate(`/playlist/${ReservedPlaylists.favorites}`)
      }
      style={{ width: props.size, height: props.size }}
      className={cn("gap-0 rounded-lg bg-red", props.className)}
    >
      <AccentText className="text-[3rem] text-neutral100">
        {trackCount}
      </AccentText>
      <StyledText className="text-neutral100">{t("common.tracks")}</StyledText>
    </Button>
  );
}
//#endregion
