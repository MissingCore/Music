import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { queries as q } from "~/queries/keyStore";

//#region Queries
export function usePlaylist(playlistName: string) {
  return useQuery({ ...q.playlists.detail(playlistName) });
}

export function usePlaylistForScreen(playlistName: string) {
  const { t } = useTranslation();
  return useQuery({
    ...q.playlists.detail(playlistName),
    select: ({ name, artwork, isFavorite, tracks, duration }) => ({
      name,
      imageSource: artwork,
      metadata: [
        t("term.playlist"),
        t("plural.track", { count: tracks.length }),
        duration,
      ],
      tracks: tracks.map((track) => ({
        id: track.id,
        title: track.name,
        description: track.artists?.join(", ") ?? "—",
        imageSource: track.artwork,
      })),

      isFavorite,
    }),
  });
}
//#endregion
