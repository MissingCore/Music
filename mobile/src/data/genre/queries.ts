import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { updateGenre } from "./api";
import { queries as q } from "../keyStore";

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
        description: track.artists?.join(", ") ?? "—",
        imageSource: track.artwork,
      })),
    }),
  });
}

export function useGenres() {
  return useQuery({ ...q.genres.all });
}
//#endregion

//#region Mutations
export function useUpdateGenre(genreName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updatedValues: { artwork?: string | null }) =>
      updateGenre(genreName, updatedValues),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: q.genres._def });
    },
  });
}
//#endregion
