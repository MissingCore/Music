import { useQuery } from "@tanstack/react-query";
import { asc } from "drizzle-orm";
import { useMemo } from "react";

import { db } from "@/db";
import { artists } from "@/db/schema";

import type { ExtractFnReturnType } from "@/lib/react-query";

/** @description Fetch all artists with their relations from database. */
export async function getArtists() {
  return await db.query.artists.findMany({
    with: { tracks: true },
    orderBy: [asc(artists.name)],
  });
}

type QueryFnType = typeof getArtists;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Gets all artists with its relations, unmodified. */
export const useArtistsQuery = <TData = QueryFnData>(
  select?: (data: QueryFnData) => TData,
) =>
  useQuery({
    queryKey: ["all-artists"],
    queryFn: getArtists,
    select,
    staleTime: Infinity,
    gcTime: Infinity,
  });

/** @description Return all artists w/ their track count. */
export const useFormattedArtists = () =>
  useArtistsQuery((data: QueryFnData) =>
    data.map(({ tracks, ...rest }) => ({ ...rest, numTracks: tracks.length })),
  );

/** @description Group artists by their 1st character for `<SectionList />`. */
export const useGroupedArtists = () => {
  const { isPending, error, data } = useFormattedArtists();

  return {
    isPending,
    error,
    data: useMemo(() => {
      // By default, return an empty array since `<SectionList />`'s
      // `sections` prop doesn't like `undefined`.
      if (!data) return [];

      // Group artists by their 1st character.
      const groupedArtists: Record<string, typeof data> = {};
      data.forEach((artist) => {
        const key = /[a-zA-Z]/.test(artist.name.charAt(0))
          ? artist.name.charAt(0).toUpperCase()
          : "#";
        if (Object.hasOwn(groupedArtists, key))
          groupedArtists[key].push(artist);
        else groupedArtists[key] = [artist];
      });

      // Convert object to array, sort by character key and artist name.
      return Object.entries(groupedArtists)
        .map(([key, arts]) => ({
          title: key,
          data: arts.toSorted((a, b) =>
            a.name.localeCompare(b.name, undefined, { caseFirst: "upper" }),
          ),
        }))
        .sort((a, b) => a.title.localeCompare(b.title));
    }, [data]),
  };
};
