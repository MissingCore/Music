import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { queries as q } from "../keyStore";

//#region Queries
export function useGenreDetails(genreName: string) {
  const { t } = useTranslation();
  return useQuery({
    ...q.genres.detail(genreName),
    select: ({ name, artworkSrc, duration, trackCount: count }) => ({
      name,
      imageSource: artworkSrc ?? null,
      metadata: [t("term.genre"), t("plural.track", { count }), `${duration}`],
    }),
  });
}

export function useGenreTracks(genreName: string) {
  return useQuery({
    ...q.genres.detail(genreName),
    select: ({ tracks }) =>
      tracks.map((track) => ({
        id: track.id,
        protocol: track.protocol,
        title: track.name,
        description: track.artist ?? "—",
        imageSource: track.artworkSrc ?? null,
      })),
  });
}

export function useGenres() {
  return useQuery({ ...q.genres.all });
}
//#endregion
