import { useQuery } from "@tanstack/react-query";

import { db } from "@/db";

import type { ExtractFnReturnType } from "@/lib/react-query";
import { albumKeys } from "./queryKeys";

async function getAlbums() {
  return await db.query.albums.findMany({
    with: { artist: true, tracks: true },
  });
}

type QueryFnType = typeof getAlbums;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Gets all albums with its relations. */
export const useAlbums = () =>
  useQuery({
    queryKey: albumKeys.all,
    queryFn: getAlbums,
    // Data returned from `select` doesn't get saved to the cache.
    select: formatAlbums,
    staleTime: Infinity,
  });

/** @description Summarize information about each album. */
function formatAlbums(data: QueryFnData) {
  return data
    .map(({ id, name, artistName, coverSrc, tracks }) => ({
      ...{ id, name, artistName, coverSrc },
      numTracks: tracks.length,
    }))
    .toSorted((a, b) => a.name.localeCompare(b.name));
}
