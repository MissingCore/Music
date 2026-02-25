import { eq } from "drizzle-orm";

import { albums, playlists } from "~/db/schema";

import { getAlbumsSummary } from "../album/api";
import { getPlaylistsSummary } from "../playlist/api";

//#region GET Methods
export async function getFavoriteLists() {
  const [favAlbums, favPlaylists] = await Promise.all([
    getAlbumsSummary([eq(albums.isFavorite, true)]),
    getPlaylistsSummary(false, [eq(playlists.isFavorite, true)]),
  ]);
  return { albums: favAlbums, playlists: favPlaylists };
}
//#endregion
