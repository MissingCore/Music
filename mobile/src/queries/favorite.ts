import { createQueryKeys } from "@lukemorales/query-key-factory";
import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useTranslation } from "react-i18next";

import { albums, playlists } from "@/db/schema";
import { formatForCurrentScreen, formatForMediaCard } from "@/db/utils";

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

//#region Queries
/** Return list of `MediaCard.Content` of favorited albums & playlists. */
export function useFavoriteListsForCards() {
  const { t } = useTranslation();
  return useQuery({
    ...favoriteKeys.lists,
    select: (data) =>
      [
        ...data.albums.map((album) =>
          formatForMediaCard({ type: "album", data: album, t }),
        ),
        ...data.playlists.map((playlist) =>
          formatForMediaCard({ type: "playlist", data: playlist, t }),
        ),
      ].sort((a, b) => a.title.localeCompare(b.title)),
  });
}

/** Get the number of favorited tracks. */
export function useFavoriteTracksCount() {
  return useQuery({
    ...favoriteKeys.tracks,
    select: (data) => data.tracks.length,
  });
}

/** Format list of favorited tracks for playlist's `(current)` screen. */
export function useFavoriteTracksForCurrentPage() {
  const { t } = useTranslation();
  return useQuery({
    ...favoriteKeys.tracks,
    select: (data) => ({
      ...formatForCurrentScreen({ type: "playlist", data, t }),
      imageSource: ReservedPlaylists.favorites,
    }),
  });
}
//#endregion
