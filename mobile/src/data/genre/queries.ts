import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { queries as q } from "../keyStore";
import { getArtistsString } from "../artist/utils";

//#region Queries
export function useGenre(genreName: string) {
  return useQuery({ ...q.genres.detail(genreName) });
}

export function useGenreForScreen(genreName: string) {
  const { t } = useTranslation();
  return useQuery({
    ...q.genres.detail(genreName),
    select: ({ name, artwork, tracks, duration }) => ({
      name,
      imageSource: artwork,
      metadata: [
        t("term.genre"),
        t("plural.track", { count: tracks.length }),
        duration,
      ],
      tracks: tracks.map((track) => ({
        id: track.id,
        title: track.name,
        description: getArtistsString(track.artists),
        imageSource: track.artwork,
      })),
    }),
  });
}

export function useGenres() {
  return useQuery({ ...q.genres.all });
}
//#endregion
