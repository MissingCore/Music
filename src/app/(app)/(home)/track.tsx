import { useTracksForTrackCard } from "@/api/tracks";
import { SpecialPlaylists } from "@/features/playback/constants";

import { Loading } from "@/components/ui/Loading";
import { Description } from "@/components/ui/Text";
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
        isPending ? <Loading /> : <Description>No Tracks Found</Description>
      }
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}
    />
  );
}
