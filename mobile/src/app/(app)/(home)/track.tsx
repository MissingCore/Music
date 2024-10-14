import { useTracksForTrackCard } from "@/api/tracks";

import { LoadingIndicator } from "@/components/ui/loading";
import { Description } from "@/components/ui/text";
import { ReservedPlaylists } from "@/modules/media/constants";
import { TrackList } from "@/modules/media/components";

/** Screen for `/track` route. */
export default function TrackScreen() {
  const { isPending, data } = useTracksForTrackCard();

  // Information about this track list.
  const trackSource = {
    type: "playlist",
    id: ReservedPlaylists.tracks,
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
