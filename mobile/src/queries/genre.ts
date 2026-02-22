import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { genres } from "~/db/schema";

import { updateGenre } from "~/api/genre";
import { getTrackArtwork } from "~/api/track.utils";
import { queries as q } from "./keyStore";

import { formatSeconds } from "~/utils/number";

//#region Queries
export function useGenre(genrename: string) {
  return useQuery({ ...q.genres.detail(genrename) });
}

export function useGenreForScreen(genreName: string) {
  const { t } = useTranslation();
  return useQuery({
    ...q.genres.detail(genreName),
    select: ({ name, artwork, tracks }) => ({
      name,
      imageSource: artwork,
      metadata: [
        t("term.genre"),
        t("plural.track", { count: tracks.length }),
        formatSeconds(tracks.reduce((total, curr) => total + curr.duration, 0)),
      ],
      tracks: tracks.map((track) => {
        let artistNames: string[] = [];
        try {
          const asArr: Array<string | null> = JSON.parse(track.artists);
          artistNames = asArr.filter((name) => name !== null);
        } catch {}

        return {
          id: track.id,
          title: track.name,
          description: artistNames.join(", ") ?? "—",
          imageSource: getTrackArtwork(track),
        };
      }),
    }),
  });
}

export function useGenres() {
  return useQuery({
    ...q.genres.all,
    select: (data) =>
      data
        .filter(({ trackCount }) => trackCount > 0)
        .map((a) => ({ ...a, duration: Number(a.duration) || 0 }))
        .sort((a, b) => a.name.localeCompare(b.name)),
  });
}
//#endregion

//#region Mutations
export function useUpdateGenre(genreName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      updatedValues: Partial<Omit<typeof genres.$inferInsert, "name">>,
    ) => updateGenre(genreName, updatedValues),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: q.genres._def });
    },
  });
}
//#endregion
