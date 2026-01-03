import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { artists } from "~/db/schema";
import { getTrackCover } from "~/db/utils";

import { updateArtist } from "~/api/artist";
import { queries as q } from "./keyStore";

import { formatSeconds } from "~/utils/number";

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
    select: ({ name, artwork, albums, tracks }) => ({
      name,
      imageSource: artwork,
      metadata: [
        t("plural.track", { count: tracks.length }),
        formatSeconds(tracks.reduce((total, curr) => total + curr.duration, 0)),
      ],
      albums: albums.length > 0 ? albums : null,
      tracks: tracks.map((track) => ({
        id: track.id,
        title: track.name,
        description: track.album?.name ?? "—",
        imageSource: getTrackCover(track),
      })),
    }),
  });
}

/** Sort artists by their name using `localeCompare`. */
export function useArtists() {
  return useQuery({
    ...q.artists.all,
    select: (data) =>
      data
        .filter(({ tracksToArtists }) => tracksToArtists.length > 0)
        .map(({ tracksToArtists: _, ...artist }) => artist)
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
