import { createQueryKeys } from "@lukemorales/query-key-factory";

import { getArtist, getArtistAlbums, getArtists } from "@/api/new/artist";

/** Query keys used in `useQuery` for artists. */
export const artistKeys = createQueryKeys("artists", {
  all: {
    queryKey: null,
    queryFn: () => getArtists(),
  },
  detail: (artistName: string) => ({
    queryKey: [artistName],
    queryFn: async () => ({
      ...(await getArtist(artistName)),
      albums: await getArtistAlbums(artistName),
    }),
  }),
});
