import { useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

import type { Album } from "@/db/schema";

import { useArtistForScreen } from "@/queries/artist";
import { useGetColumn } from "@/hooks/useGetColumn";
import { MediaListHeader } from "@/layouts/CurrentList";

import { StyledText } from "@/components/Typography";
import { MediaCard, TrackList } from "@/modules/media/components";

/** Screen for `/artist/[id]` route. */
export default function CurrentArtistScreen() {
  const { id: _artistName } = useLocalSearchParams<{ id: string }>();
  const artistName = _artistName!;
  const { isPending, error, data } = useArtistForScreen(artistName);

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (error) {
    return (
      <View className="w-full flex-1 px-4">
        <StyledText preset="dimOnCanvas" className="text-base">
          Error: Artist not found
        </StyledText>
      </View>
    );
  }

  // Information about this track list.
  const trackSource = { type: "artist", id: artistName } as const;

  return (
    <>
      <View className="px-4">
        <MediaListHeader
          title={data.name}
          metadata={data.metadata}
          trackSource={trackSource}
        />
      </View>
      <TrackList
        data={data.tracks}
        trackSource={trackSource}
        // ListHeaderComponent={<ArtistAlbums albums={data.albums} />}
        // contentContainerStyle={{ paddingHorizontal: 20 }}
        // ListEmptyComponent={
        //   <Description className="text-start">
        //     Artist has no tracks.
        //   </Description>
        // }
      />
    </>
  );
}

/**
 * Display a list of the artist's albums. Renders a heading for the track
 * list only if the artist has albums.
 */
function ArtistAlbums({ albums }: { albums: Album[] | null }) {
  const { width } = useGetColumn({
    ...{ cols: 1, gap: 0, gutters: 32, minWidth: 100 },
  });

  if (!albums) return null;

  // FIXME: We should use a horizontal FlashList
  return (
    <>
      <StyledText className="mb-2 text-xl">Albums</StyledText>
      <View className="-mx-5 mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          overScrollMode="never"
          contentContainerClassName="grow gap-4 px-5"
        >
          {albums.map((album) => (
            <MediaCard
              key={album.id}
              type="album"
              size={width}
              source={album.artwork}
              href={`/album/${album.id}`}
              title={album.name}
              subtitle={`${album.releaseYear ?? "————"}`}
            />
          ))}
        </ScrollView>
      </View>
      <StyledText className="mb-2 text-xl">Tracks</StyledText>
    </>
  );
}
