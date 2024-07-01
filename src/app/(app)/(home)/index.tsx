import { FlashList } from "@shopify/flash-list";
import { Link } from "expo-router";
import { useAtomValue } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import type { NativeScrollEvent } from "react-native";
import { Pressable, ScrollView, View } from "react-native";

import {
  useFavoriteListsForMediaCard,
  useFavoriteTracksCount,
} from "@/api/favorites";
import { useGetColumn } from "@/hooks/layout";
import { recentlyPlayedDataAtom } from "@/features/playback/api/recent";

import { abbreviateNum } from "@/utils/number";
import { MediaCard, PlaceholderContent } from "@/components/media/card";
import { ScrollRow } from "@/components/ui/container";
import { Description, Heading } from "@/components/ui/text";
import { SpecialPlaylists } from "@/features/playback/constants";

/** @description Detect if we're near the end of a `<ScrollView />`. */
const isCloseToBottom = ({
  layoutMeasurement,
  contentOffset,
  contentSize,
}: NativeScrollEvent) => {
  const paddingToBottom = 16;
  return (
    layoutMeasurement.height + contentOffset.y >=
    contentSize.height - paddingToBottom
  );
};

/** @description Screen for `/` route. */
export default function HomeScreen() {
  const scrollViewRef = useRef<ScrollView>(null);
  const [endOfScrollView, setEndOfScrollView] = useState(false);

  /**
   * @description Fix scroll position if we're at the end of the `<ScrollView />`
   *  and we removed all items at the end.
   */
  const adjustScrollPosition = useCallback(() => {
    if (endOfScrollView) scrollViewRef.current?.scrollToEnd();
  }, [endOfScrollView]);

  const { width: colWidthSmall } = useGetColumn({
    ...{ cols: 1, gap: 0, gutters: 32, minWidth: 100 },
  });

  return (
    <ScrollView
      ref={scrollViewRef}
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pt-[22px]"
      onMomentumScrollEnd={({ nativeEvent }) => {
        setEndOfScrollView(isCloseToBottom(nativeEvent));
      }}
    >
      <Heading as="h2" className="mb-4 px-4 text-start font-geistMono">
        RECENTLY PLAYED
      </Heading>
      {/*
        `<View />` wrapping around `<ScrollRow />` is needed due to some
        layout jank where on a fresh install of the app, when we add an
        item to "Recently Played", the `<ScrollRow />` overprovide height.
      */}
      <View>
        <ScrollRow contentContainerClassName="gap-4">
          <RecentlyPlayed colWidth={colWidthSmall} />
        </ScrollRow>
      </View>

      <Heading as="h2" className="mb-4 mt-8 px-4 text-start font-geistMono">
        FAVORITES
      </Heading>
      <FavoriteListSection fixScrollPosition={adjustScrollPosition} />
    </ScrollView>
  );
}

/** @description An array of `<MediaCards />` of recently played media. */
function RecentlyPlayed({ colWidth }: { colWidth: number }) {
  const recentlyPlayedData = useAtomValue(recentlyPlayedDataAtom);

  return recentlyPlayedData.length === 0 ? (
    <Description className="my-4 text-start">
      You haven't played anything yet!
    </Description>
  ) : (
    recentlyPlayedData.map((props) => (
      <MediaCard key={props.href} {...props} size={colWidth} />
    ))
  );
}

/**
 * @description Lists out albums or playlists we've favorited, and a
 *  special playlist containing all our favorited tracks.
 */
function FavoriteListSection({
  fixScrollPosition,
}: {
  fixScrollPosition: () => void;
}) {
  const { data } = useFavoriteListsForMediaCard();

  const { width, count } = useGetColumn({
    ...{ cols: 2, gap: 16, gutters: 32, minWidth: 175 },
  });

  useEffect(() => {
    fixScrollPosition();
  }, [fixScrollPosition, data]);

  return (
    <View className="-m-2 mt-0 flex-1 px-4">
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
      />
    </View>
  );
}

/**
 * @description A button displaying the number of favorite tracks & takes
 *  the user to a special "Favorite Tracks" playlist.
 */
function FavoriteTracks({ colWidth }: { colWidth: number }) {
  const { isPending, error, data } = useFavoriteTracksCount();

  const trackCount = isPending || error ? "" : abbreviateNum(data);

  return (
    <Link href={`/playlist/${SpecialPlaylists.favorites}`} asChild>
      <Pressable
        style={{ width: colWidth, height: colWidth }}
        className="items-center justify-center rounded-lg bg-accent500 active:opacity-75"
      >
        <Heading as="h1">{`${trackCount}\nTracks`}</Heading>
      </Pressable>
    </Link>
  );
}
