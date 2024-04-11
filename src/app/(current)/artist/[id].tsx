import { useLocalSearchParams } from "expo-router";
import { ActivityIndicator, Text, View } from "react-native";

import { useFormattedArtist } from "@/features/artist/api/getArtist";

import Colors from "@/constants/Colors";
import { MediaList, MediaListHeader } from "@/components/media/MediaList";
import { TrackCard } from "@/features/track/components/TrackCard";

/** @description Screen for `/artist/[id]` route. */
export default function CurrentArtistScreen() {
  const { id } = useLocalSearchParams();
  const { isPending, error, data } = useFormattedArtist(id as string);

  return (
    <View className="w-full flex-1 px-4">
      {isPending && (
        <ActivityIndicator
          size="large"
          color={Colors.surface500}
          className="mx-auto mt-5"
        />
      )}
      {(!!error || !data) && (
        <Text className="mx-auto text-center font-geistMono text-base text-accent50">
          Error: Artist not found
        </Text>
      )}

      {data && (
        <>
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
        </>
      )}
    </View>
  );
}
