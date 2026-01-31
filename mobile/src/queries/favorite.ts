import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { AlbumWithTracks } from "~/db/schema";
import { formatForMediaCard } from "~/db/utils";

import { queries as q } from "./keyStore";

import { FavoritesPlaylistKey } from "~/modules/media/constants";

//#region Queries
/** Return list of `MediaCardContent` of favorited albums & playlists. */
export function useFavoriteListsForCards() {
  const { t } = useTranslation();
  return useQuery({
    ...q.favorites.lists,
    select: (data) =>
      [
        ...(data.albums as AlbumWithTracks[]).map((album) => {
          album.tracks = [];
          return formatForMediaCard({ type: "album", data: album, t });
        }),
        ...data.playlists.map((playlist) =>
          formatForMediaCard({ type: "playlist", data: playlist, t }),
        ),
      ].sort((a, b) => {
        // Have "Favorites Tracks" playlist appear first in the list.
        if (a.type === "playlist" && a.id === FavoritesPlaylistKey) {
          return -1;
        } else if (b.type === "playlist" && b.id === FavoritesPlaylistKey) {
          return 1;
        }

        return a.title.localeCompare(b.title);
      }),
  });
}
//#endregion
