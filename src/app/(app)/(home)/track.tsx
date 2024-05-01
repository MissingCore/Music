import { Text } from "react-native";

import { useTracksForTrackCard } from "@/api/tracks";
import { SpecialPlaylists } from "@/features/playback/utils/trackList";

import { MediaList } from "@/components/media/MediaList";
import { Loading } from "@/components/ui/Loading";
import { TrackCard } from "@/features/track/components/TrackCard";

/** @description Screen for `/track` route. */
export default function TrackScreen() {
  const { isPending, data } = useTracksForTrackCard();

  // Information about this track list.
  const trackSource = {
    type: "playlist",
    name: SpecialPlaylists.tracks,
    id: SpecialPlaylists.tracks,
  } as const;

  return (
    <MediaList
      data={data}
      renderItem={({ item }) => <TrackCard {...{ ...item, trackSource }} />}
      ListEmptyComponent={
        isPending ? (
          <Loading />
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
