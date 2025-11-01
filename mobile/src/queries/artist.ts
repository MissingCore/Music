import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { artists } from "~/db/schema";
import { formatForCurrentScreen } from "~/db/utils";

import { updateArtist } from "~/api/artist";
import { queries as q } from "./keyStore";

//#region Queries
/** Get specified artist. */
export function useArtist(artistName: string) {
  return useQuery({ ...q.artists.detail(artistName) });
}

/** Format artist information for artist's `(current)` screen. */
export function useArtistForScreen(artistName: string) {
  const { t } = useTranslation();
  return useQuery({
    ...q.artists.detail(artistName),
    select: ({ albums, ...artist }) => ({
      ...formatForCurrentScreen({ type: "artist", data: artist, t }),
      albums: albums.length > 0 ? albums : null,
    }),
  });
}

/** Sort artists by their name using `localeCompare`. */
export function useArtists() {
  return useQuery({
    ...q.artists.all,
    select: (data) =>
      data
        .filter(({ tracks }) => tracks.length > 0)
        .map(({ tracks: _, ...artist }) => artist)
        .sort((a, b) => a.name.localeCompare(b.name)),
  });
}
//#endregion

//#region Mutations
/** Update specified artist. */
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
