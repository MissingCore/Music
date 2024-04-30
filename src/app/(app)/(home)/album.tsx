import { FlatList, Text } from "react-native";

import { useAlbumsForMediaCard } from "@/api/albums";
import { useGetColumnWidth } from "@/hooks/layout";

import { MediaCard } from "@/components/media/MediaCard";
import { Loading } from "@/components/ui/Loading";

/** @description Screen for `/album` route. */
export default function AlbumScreen() {
  const { isPending, data } = useAlbumsForMediaCard();
  const colWidth = useGetColumnWidth({
    cols: 2,
    gap: 16,
    gutters: 32,
    minWidth: 175,
  });

  return (
    <FlatList
      data={data}
      keyExtractor={({ href }) => href}
      renderItem={({ item: data }) => <MediaCard {...data} size={colWidth} />}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        isPending ? (
          <Loading />
        ) : (
          <Text className="mx-auto text-center font-geistMono text-base text-foreground100">
            No Albums Found
          </Text>
        )
      }
      contentContainerClassName="w-full flex-row flex-wrap gap-4 px-4 pt-[22px] pb-4"
    />
  );
}
