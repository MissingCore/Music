import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { ActivityIndicator, FlatList, Text } from "react-native";

import { getAlbums } from "@/lib/api";
import { useGetColumnWidth } from "@/hooks/layout";

import Colors from "@/constants/Colors";
import MediaCard from "@/features/media/MediaCard";

/** @description Screen for `/album` route. */
export default function AlbumScreen() {
  const { isPending, data } = useQuery({
    queryKey: ["all-albums"],
    queryFn: getAlbums,
    staleTime: Infinity,
    gcTime: Infinity,
  });
  const colWidth = useGetColumnWidth({
    cols: 2,
    gap: 16,
    gutters: 32,
    minWidth: 175,
  });

  return (
    <FlatList
      data={data}
      keyExtractor={({ id }) => id}
      renderItem={({ item: { id, name, coverSrc, artistName, numTracks } }) => (
        <Link href={`/album/${id}`}>
          <MediaCard
            imgSrc={coverSrc}
            imgSize={colWidth}
            type="album"
            title={name}
            subTitle={artistName}
            extra={`| ${numTracks} Track${numTracks !== 1 ? "s" : ""}`}
          />
        </Link>
      )}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        isPending ? (
          <ActivityIndicator
            size="large"
            color={Colors.surface500}
            className="mx-auto"
          />
        ) : (
          <Text className="mx-auto text-center font-geistMono text-base text-foreground100">
            No Albums Found
          </Text>
        )
      }
      contentContainerClassName="mt-5 w-full flex-row flex-wrap gap-4 px-4 pb-16"
    />
  );
}
