import { Text } from "react-native";

import { useTracks } from "@/features/track/api/getTracks";

import { MediaList } from "@/components/media/MediaList";
import { Spinner } from "@/components/ui/Spinner";
import { TrackCard } from "@/features/track/components/TrackCard";

/** @description Screen for `/track` route. */
export default function TrackScreen() {
  const { isPending, data } = useTracks();

  return (
    <MediaList
      data={data}
      renderItem={({
        item: { id, name, coverSrc, duration, artistName, uri },
      }) => (
        <TrackCard
          {...{ id, coverSrc, duration, uri }}
          textContent={[name, artistName]}
        />
      )}
      ListEmptyComponent={
        isPending ? (
          <Spinner />
        ) : (
          <Text className="mx-auto text-center font-geistMono text-base text-foreground100">
            No Tracks Found
          </Text>
        )
      }
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}
    />
  );
}
