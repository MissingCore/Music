import { ScrollView, Text, View } from "react-native";

import { useGetColumnWidth } from "@/hooks/layout";
import { useFavoriteLists } from "@/features/data/getFavoriteLists";

import { MediaCard } from "@/components/media/MediaCard";

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
        <MediaCard
          href="/"
          imgSrc={null}
          imgSize={colWidthSmall}
          type="artist"
          title="Artist Name"
          subtitle="24 Tracks"
        />
        <MediaCard
          href="/"
          imgSrc={null}
          imgSize={colWidthSmall}
          type="track"
          title="Track Name"
          subtitle="Artist Name"
        />
        <MediaCard
          href="/"
          imgSrc={null}
          imgSize={colWidthSmall}
          type="playlist"
          title="Playlist Name"
          subtitle="8 Tracks"
        />
        <MediaCard
          href="/"
          imgSrc={null}
          imgSize={colWidthSmall}
          type="album"
          title="Album Name"
          subtitle="Artist Name"
          extra="| 10 Tracks"
        />
        <MediaCard
          href="/"
          imgSrc={null}
          imgSize={colWidthSmall}
          type="track"
          title="Track Name"
          subtitle="Artist Name"
        />
      </ScrollView>

      <View className="px-4">
        <Text className="mb-4 mt-8 font-geistMonoMedium text-subtitle text-foreground50">
          FAVORITES
        </Text>
        <View className="w-full flex-row flex-wrap gap-4">
          <View style={{ maxWidth: colWidth }} className="w-full">
            <View className="aspect-square items-center justify-center rounded-lg bg-accent500">
              <Text className="font-ndot57 text-title text-foreground50">
                10
              </Text>
              <Text className="font-ndot57 text-title text-foreground50">
                SONGS
              </Text>
            </View>
          </View>

          <FavoriteLists imgSize={colWidth} />
        </View>
      </View>
    </ScrollView>
  );
}

/** @description An array of `<MediaCards />` of favorited albums & playlists. */
function FavoriteLists({ imgSize }: { imgSize: number }) {
  const { isPending, error, data } = useFavoriteLists();

  if (isPending || error) return null;

  return data.map(({ ref, ...rest }) => (
    <MediaCard
      key={`${rest.type}-${ref}`}
      href={`/${rest.type}/${ref}`}
      {...{ imgSize, ...rest }}
    />
  ));
}
