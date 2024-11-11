import { createQueryKeys } from "@lukemorales/query-key-factory";

import { getTrack, getTrackPlaylists, getTracks } from "@/api/new/track";

/** Query keys used in `useQuery` for tracks. */
export const trackKeys = createQueryKeys("tracks", {
  all: {
    queryKey: null,
    queryFn: () => getTracks(),
  },
  detail: (trackId: string) => ({
    queryKey: [trackId],
    queryFn: () => getTrack({ id: trackId }),
    contextQueries: {
      playlists: {
        queryFn: () => getTrackPlaylists({ id: trackId }),
      },
    },
  }),
});
