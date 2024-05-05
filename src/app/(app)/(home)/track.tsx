import { Text } from "react-native";

import { useTracksForTrackCard } from "@/api/tracks";
import { SpecialPlaylists } from "@/features/playback/constants";

import { Loading } from "@/components/ui/Loading";
import { TrackList } from "@/features/track/components/TrackList";

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
    <TrackList
      data={data}
      config={{ source: trackSource }}
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
