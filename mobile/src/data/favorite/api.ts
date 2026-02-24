import { eq } from "drizzle-orm";

import { albums, playlists } from "~/db/schema";

import { getPlaylists } from "~/api/playlist";
import { getAlbums } from "../album/api";

//#region GET Methods
export async function getFavoriteLists() {
  const [favAlbums, favPlaylists] = await Promise.all([
    getAlbums(undefined, [eq(albums.isFavorite, true)]),
    getPlaylists({
      where: [eq(playlists.isFavorite, true)],
      columns: ["name", "artwork"],
      trackColumns: ["artwork"],
      albumColumns: ["artwork"],
    }),
  ]);
  return { albums: favAlbums, playlists: favPlaylists };
}
//#endregion
