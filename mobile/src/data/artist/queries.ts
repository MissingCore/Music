import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { updateArtist } from "./api";
import { queries as q } from "../keyStore";

//#region Queries
export function useArtist(artistName: string) {
  return useQuery({ ...q.artists.detail(artistName) });
}

export function useArtistForScreen(artistName: string) {
  const { t } = useTranslation();
  return useQuery({
    ...q.artists.detail(artistName),
    select: ({ name, artwork, albums, tracks, duration }) => ({
      name,
      imageSource: artwork,
      metadata: [
        t("term.artist"),
        t("plural.track", { count: tracks.length }),
        duration,
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
    mutationFn: (updatedValues: { artwork?: string | null }) =>
      updateArtist(artistName, updatedValues),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: q.artists._def });
    },
  });
}
//#endregion
