import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { Artist } from "@/db/schema";
import { formatForCurrentScreen } from "@/db/utils";

import { queries } from "./keyStore";

//#region Queries
/**
 * Group artists by their first character (or in a group of special
 * characters) for a `<FlashList />` that functions like a `<SectionList />`.
 */
export function useArtistsForList() {
  return useQuery({
    ...queries.artists.all,
    select: (data) => {
      // Group artists by their 1st character (artists are already
      // pre-sorted by their name).
      const groupedArtists: Record<string, Artist[]> = {};
      data.forEach(({ name }) => {
        const key = /[a-zA-Z]/.test(name.charAt(0))
          ? name.charAt(0).toUpperCase()
          : "#";
        if (Object.hasOwn(groupedArtists, key)) {
          groupedArtists[key]!.push({ name });
        } else groupedArtists[key] = [{ name }];
      });

      // Convert object to array to be used in a `<FlashList />` that acts
      // like a `<SectionList />`.
      return Object.entries(groupedArtists)
        .sort((a, b) => a[0].localeCompare(b[0])) // Moves the `#` group to the front
        .map(([character, artists]) => [character, ...artists])
        .flat();
    },
  });
}

/** Format artist information for artist's `(current)` screen. */
export function useArtistForCurrentPage(artistName: string) {
  const { t } = useTranslation();
  return useQuery({
    ...queries.artists.detail(artistName),
    select: ({ albums, ...artist }) => ({
      ...formatForCurrentScreen({ type: "artist", data: artist, t }),
      albums: albums.length > 0 ? albums : null,
    }),
  });
}
//#endregion
