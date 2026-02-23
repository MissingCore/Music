import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { queries as q } from "~/queries/keyStore";

import { formatSeconds } from "~/utils/number";

//#region Queries
export function useArtistForScreen(artistName: string) {
  const { t } = useTranslation();
  return useQuery({
    ...q.artists.detail(artistName),
    select: ({ name, artwork, albums, tracks }) => ({
      name,
      imageSource: artwork,
      metadata: [
        t("term.artist"),
        t("plural.track", { count: tracks.length }),
        formatSeconds(tracks.reduce((total, curr) => total + curr.duration, 0)),
      ],
      albums: albums.length > 0 ? albums : null,
      tracks: tracks.map((track) => ({
        id: track.id,
        title: track.name,
        description: track.album ?? "—",
        imageSource: track.artwork,
      })),
    }),
  });
}

export function useArtists() {
  return useQuery({ ...q.artists.all });
}
//#endregion
