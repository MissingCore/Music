import { createQueryKeys } from "@lukemorales/query-key-factory";

import { getPlaylist, getPlaylists } from "@/api/new/playlist";

/** Query keys used in `useQuery` for playlists. */
export const playlistKeys = createQueryKeys("playlists", {
  all: {
    queryKey: null,
    queryFn: () => getPlaylists(),
  },
  detail: (playlistName: string) => ({
    queryKey: [playlistName],
    queryFn: () => getPlaylist(playlistName),
  }),
});
