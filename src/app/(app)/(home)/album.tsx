import { FlatList, Text } from "react-native";

import { useAlbums } from "@/features/album/api/getAlbums";
import { useGetColumnWidth } from "@/hooks/layout";

import { MediaCard } from "@/components/media/MediaCard";
import { Loading } from "@/components/ui/Loading";
import { getTrackCountStr } from "@/features/track/utils";

/** @description Screen for `/album` route. */
export default function AlbumScreen() {
  const { isPending, data } = useAlbums();
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
        <MediaCard
          href={`/album/${id}`}
          imgSrc={coverSrc}
          imgSize={colWidth}
          type="album"
          title={name}
          subtitle={artistName}
          extra={`| ${getTrackCountStr(numTracks)}`}
        />
      )}
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
