import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { artists } from "~/db/schema";

import { updateArtist } from "~/api/artist";
import { queries as q } from "./keyStore";

//#region Queries
/** Get specified artist. */
export function useArtist(artistName: string) {
  return useQuery({ ...q.artists.detail(artistName) });
}

export function useArtists() {
  return useQuery({
    ...q.artists.all,
    select: (data) =>
      data
        .filter(({ trackCount }) => trackCount > 0)
        .map((a) => ({ ...a, duration: Number(a.duration) || 0 }))
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
