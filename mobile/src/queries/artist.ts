import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { Artist, artists } from "~/db/schema";
import { formatForCurrentScreen } from "~/db/utils";

import { updateArtist } from "~/api/artist";
import { Resynchronize } from "~/modules/media/services/Resynchronize";
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

/**
 * Group artists by their first character (or in a group of special
 * characters), like an index in a book for a list that functions like
 * a `<SectionList />`.
 */
export function useArtistsForIndex() {
  return useQuery({
    ...q.artists.all,
    select: (data) => {
      // Group artists by their 1st character (artists are already
      // pre-sorted by their name).
      const groupedArtists: Record<string, Artist[]> = {};
      data.forEach((artist) => {
        const key = /[a-zA-Z]/.test(artist.name.charAt(0))
          ? artist.name.charAt(0).toLocaleUpperCase()
          : "#";
        if (Object.hasOwn(groupedArtists, key)) {
          groupedArtists[key]?.push(artist);
        } else groupedArtists[key] = [artist];
      });

      // Convert object to array to be used in a list that acts like a `<SectionList />`.
      return Object.entries(groupedArtists)
        .sort((a, b) => a[0].localeCompare(b[0])) // Moves the `#` group to the front
        .flatMap(([character, artists]) => [character, ...artists]);
    },
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
    onSuccess: (_, { artwork }) => {
      queryClient.invalidateQueries({ queryKey: q.artists._def });
      if (artwork !== undefined) {
        Resynchronize.onImage({ type: "artist", id: artistName });
      }
    },
  });
}
//#endregion
