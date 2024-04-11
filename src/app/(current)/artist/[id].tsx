import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

import { useFormattedArtist } from "@/features/artist/api/getArtist";

import { MediaList, MediaListHeader } from "@/components/media/MediaList";
import { TrackCard } from "@/features/track/components/TrackCard";

/** @description Screen for `/artist/[id]` route. */
export default function CurrentArtistScreen() {
  const { id } = useLocalSearchParams();
  const { isPending, error, data } = useFormattedArtist(id as string);

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

  return (
    <View className="w-full flex-1 px-4">
      <MediaListHeader title={data.name} metadata={data.metadata} />
      <MediaList
        data={data.tracks}
        renderItem={({ item: { id, name, coverSrc, duration, album } }) => (
          <TrackCard
            {...{ id, coverSrc, duration }}
            textContent={[name, album?.name ?? "Single"]}
          />
        )}
      />
    </View>
  );
}
