import { useTracksForTrackCard } from "@/api/tracks";
import { SpecialPlaylists } from "@/features/playback/constants";

import { LoadingIndicator } from "@/components/ui/loading";
import { Description } from "@/components/ui/text";
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
          <LoadingIndicator />
        ) : (
          <Description>No Tracks Found</Description>
        )
      }
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}
    />
  );
}
