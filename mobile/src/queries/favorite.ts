import { createQueryKeys } from "@lukemorales/query-key-factory";
import { eq } from "drizzle-orm";

import { albums, playlists } from "@/db/schema";

import { getAlbums } from "@/api/new/album";
import { getPlaylists, getSpecialPlaylist } from "@/api/new/playlist";

import { ReservedPlaylists } from "@/modules/media/constants";

/** Get favorited albums & playlists. */
async function getFavoriteLists() {
  const [favAlbums, favPlaylists] = await Promise.all([
    getAlbums([eq(albums.isFavorite, true)]),
    getPlaylists([eq(playlists.isFavorite, true)]),
  ]);
  return { albums: favAlbums, playlists: favPlaylists };
}

//#region Query Keys
/** Query keys used in `useQuery` for favorite media. */
export const favoriteKeys = createQueryKeys("favorites", {
  lists: {
    queryKey: null,
    queryFn: () => getFavoriteLists(),
  },
  tracks: {
    queryKey: [ReservedPlaylists.favorites],
    queryFn: () => getSpecialPlaylist(ReservedPlaylists.favorites),
  },
});
//#endregion
