import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { artists } from "~/db/schema";

import { queries as q } from "~/queries/keyStore";
import { updateArtist } from "./api";

import { formatSeconds } from "~/utils/number";

//#region Queries
export function useArtist(artistName: string) {
  return useQuery({ ...q.artists.detail(artistName) });
}

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

//#region Mutations
export function useUpdateArtist(artistName: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (
      updatedValues: Partial<Omit<typeof artists.$inferInsert, "name">>,
    ) => updateArtist(artistName, updatedValues),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: q.artists._def });
    },
  });
}
//#endregion
