import { Link } from "expo-router";
import { useAtomValue } from "jotai";
import { Pressable, ScrollView, Text, View } from "react-native";

import { useGetColumnWidth } from "@/hooks/layout";
import { useFavoriteLists } from "@/features/data/getFavoriteLists";
import { useFavoriteTracksCount } from "@/features/data/getFavoriteTracks";
import { recentlyPlayedDataAtom } from "@/features/playback/api/recent";

import { abbreviateNum } from "@/utils/number";
import { MediaCard } from "@/components/media/MediaCard";
import { SpecialPlaylists } from "@/features/playback/utils/trackList";

/** @description Screen for `/` route. */
export default function HomeScreen() {
  const colWidth = useGetColumnWidth({
    cols: 2,
    gap: 16,
    gutters: 32,
    minWidth: 175,
  });

  const colWidthSmall = useGetColumnWidth({
    cols: 1,
    gap: 16,
    gutters: 32,
    minWidth: 100,
  });

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerClassName="pt-[22px] pb-4"
    >
      <Text className="mb-4 px-4 font-geistMonoMedium text-subtitle text-foreground50">
        RECENTLY PLAYED
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        overScrollMode="never"
        contentContainerClassName="gap-4 px-4"
      >
        <RecentlyPlayed colWidth={colWidthSmall} />
      </ScrollView>

      <View className="px-4">
        <Text className="mb-4 mt-8 font-geistMonoMedium text-subtitle text-foreground50">
          FAVORITES
        </Text>
        <View className="w-full flex-row flex-wrap gap-4">
          <FavoriteTracks colWidth={colWidth} />
          <FavoriteLists colWidth={colWidth} />
        </View>
      </View>
    </ScrollView>
  );
}

/** @description An array of `<MediaCards />` of recently played media. */
function RecentlyPlayed({ colWidth }: { colWidth: number }) {
  const recentlyPlayedData = useAtomValue(recentlyPlayedDataAtom);

  if (recentlyPlayedData.length === 0) {
    return (
      <Text className="my-4 font-geistMono text-base text-foreground100">
        You haven't played anything yet!
      </Text>
    );
  }

  return recentlyPlayedData.map((props) => (
    <MediaCard key={props.href} {...props} size={colWidth} />
  ));
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
        <Text className="font-ndot57 text-title text-foreground50">
          {trackCount}
        </Text>
        <Text className="font-ndot57 text-title text-foreground50">TRACKS</Text>
      </Pressable>
    </Link>
  );
}

/** @description An array of `<MediaCards />` of favorited albums & playlists. */
function FavoriteLists({ colWidth }: { colWidth: number }) {
  const { isPending, error, data } = useFavoriteLists();

  if (isPending || error) return null;

  return data.map((props) => (
    <MediaCard key={props.href} {...props} size={colWidth} />
  ));
}
