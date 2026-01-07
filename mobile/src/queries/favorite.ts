import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { AlbumWithTracks } from "~/db/schema";
import { formatForCurrentScreen, formatForMediaCard } from "~/db/utils";

import { queries as q } from "./keyStore";

import { ReservedPlaylists } from "~/modules/media/constants";

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
      ].sort((a, b) => a.title.localeCompare(b.title)),
  });
}

/** Get the number of favorited tracks. */
export function useFavoriteTracksCount() {
  return useQuery({
    ...q.favorites.tracks,
    select: (data) => data.tracks.length,
  });
}

/** Format list of favorited tracks for playlist's `(current)` screen. */
export function useFavoriteTracksForScreen() {
  const { t } = useTranslation();
  return useQuery({
    ...q.favorites.tracks,
    select: (data) => ({
      ...formatForCurrentScreen({ data, t }),
      imageSource: ReservedPlaylists.favorites,
    }),
  });
}
//#endregion
