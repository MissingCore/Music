import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { useArtist } from "@/features/artist/api/getArtist";

import { MediaList, MediaListHeader } from "@/components/media/MediaList";
import { TrackCard } from "@/features/track/components/TrackCard";

/** @description Screen for `/artist/[id]` route. */
export default function CurrentArtistScreen() {
  const { id: artistId } = useLocalSearchParams<{ id: string }>();
  const { isPending, error, data } = useArtist(decodeURIComponent(artistId));

  if (isPending) return <View className="w-full flex-1 px-4" />;
  else if (!!error || !data) {
    return (
      <View className="w-full flex-1 px-4">
        <Text className="mx-auto text-center font-geistMono text-base text-accent50">
          Error: Artist not found
        </Text>
      </View>
    );
  }

  // Information about this track list.
  const trackSrc = {
    type: "artist",
    name: `Artist\n${data.name}`,
    ref: artistId,
  } as const;

  return (
    <View className="w-full flex-1 px-4">
      <MediaListHeader
        title={data.name}
        metadata={data.metadata}
        trackSrc={trackSrc}
      />
      <MediaList
        data={data.tracks}
        renderItem={({ item: { id, name, coverSrc, duration, albumName } }) => (
          <TrackCard
            {...{ id, trackSrc, coverSrc, duration }}
            textContent={[name, albumName ?? "Single"]}
            origin="artist"
          />
        )}
      />
    </View>
  );
}
