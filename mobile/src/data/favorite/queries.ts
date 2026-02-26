import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { queries as q } from "../keyStore";

import { FavoritesPlaylistKey } from "~/modules/media/constants";
import type { MediaCardContent } from "~/modules/media/components/MediaCard.type";

//#region Queries
export function useFavoriteListsForCards() {
  const { t } = useTranslation();
  return useQuery({
    ...q.favorites.lists,
    select: (data) =>
      [
        ...data.albums.map<MediaCardContent>((album) => ({
          type: "album",
          source: album.artwork,
          id: album.id,
          title: album.name,
          description: album.artistName,
        })),
        ...data.playlists.map<MediaCardContent>((playlist) => ({
          type: "playlist",
          source: playlist.artwork,
          id: playlist.id,
          title: playlist.name,
          description: t("plural.track", { count: playlist.trackCount }),
        })),
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
