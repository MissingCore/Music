import { createQueryKeys } from "@lukemorales/query-key-factory";

import { getAlbum, getAlbums } from "@/api/new/album";

/** Query keys used in `useQuery` for albums. */
export const albumKeys = createQueryKeys("albums", {
  all: {
    queryKey: null,
    queryFn: () => getAlbums(),
  },
  detail: (albumId: string) => ({
    queryKey: [albumId],
    queryFn: () => getAlbum(albumId),
  }),
});
