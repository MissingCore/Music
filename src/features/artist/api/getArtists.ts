import { useQuery } from "@tanstack/react-query";

import { db } from "@/db";

import type { ExtractFnReturnType } from "@/lib/react-query";
import { artistKeys } from "./queryKeys";

async function getArtists() {
  return await db.query.artists.findMany({
    with: { tracks: { with: { album: true } } },
  });
}

type QueryFnType = typeof getArtists;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Gets all artists with its relations. */
export const useArtists = () =>
  useQuery({
    queryKey: artistKeys.all,
    queryFn: getArtists,
    // Data returned from `select` doesn't get saved to the cache.
    select: groupArtists,
    staleTime: Infinity,
  });

/** @description Group the data by the first character of the artist name. */
function groupArtists(data: QueryFnData) {
  // Group artists by their 1st character.
  const groupedArtists: Record<string, typeof data> = {};
  data.forEach((artist) => {
    const key = /[a-zA-Z]/.test(artist.name.charAt(0))
      ? artist.name.charAt(0).toUpperCase()
      : "#";
    if (Object.hasOwn(groupedArtists, key)) groupedArtists[key].push(artist);
    else groupedArtists[key] = [artist];
  });

  // Convert object to array, sort by character key and artist name.
  return Object.entries(groupedArtists)
    .map(([key, arts]) => ({
      title: key,
      data: arts
        .toSorted((a, b) =>
          a.name.localeCompare(b.name, undefined, { caseFirst: "upper" }),
        )
        .map(({ tracks, ...rest }) => ({ ...rest, numTracks: tracks.length })),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
