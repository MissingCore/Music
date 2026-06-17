import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useViewPreferenceStore } from "~/stores/ViewPreference/store";
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
  const isAsc = useViewPreferenceStore((s) => s.genreTracksIsAsc);
  const order = useViewPreferenceStore((s) => s.genreTracksOrder);
  return useQuery({
    ...q.genres.detail(genreName)._ctx.tracks({ isAsc, order }),
    select: (tracks) =>
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
