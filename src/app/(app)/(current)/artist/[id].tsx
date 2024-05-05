import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { useArtistForCurrentPage } from "@/api/artists/[id]";

import { MediaPageHeader } from "@/components/media/MediaPageHeader";
import { TrackList } from "@/features/track/components/TrackList";

/** @description Screen for `/artist/[id]` route. */
export default function CurrentArtistScreen() {
  const { id: artistName } = useLocalSearchParams<{ id: string }>();
  const { isPending, error, data } = useArtistForCurrentPage(artistName);

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
  const trackSource = {
    type: "artist",
    name: `Artist\n${data.name}`,
    id: artistName,
  } as const;

  return (
    <View className="w-full flex-1 px-4">
      <MediaPageHeader
        title={data.name}
        metadata={data.metadata}
        trackSource={trackSource}
      />
      <TrackList
        data={data.tracks}
        config={{ source: trackSource, origin: "artist" }}
      />
    </View>
  );
}
