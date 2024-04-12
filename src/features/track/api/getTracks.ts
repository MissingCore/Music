import { useQuery } from "@tanstack/react-query";

import { db } from "@/db";

import type { ExtractFnReturnType } from "@/lib/react-query";
import { trackKeys } from "./queryKeys";

async function getTracks() {
  return await db.query.tracks.findMany({
    with: { artist: true, album: true },
  });
}

type QueryFnType = typeof getTracks;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Gets all tracks with its relations. */
export const useTracks = () =>
  useQuery({
    queryKey: trackKeys.all,
    queryFn: getTracks,
    // Data returned from `select` doesn't get saved to the cache.
    select: formatTracks,
    staleTime: Infinity,
  });

/** @description Summarize information about each track. */
function formatTracks(data: QueryFnData) {
  return data
    .map(({ id, name, duration, uri, ...rest }) => ({
      ...{ id, name, duration, uri },
      artistName: rest.artist.name,
      coverSrc: rest.album?.coverSrc ?? rest.coverSrc,
    }))
    .toSorted((a, b) => a.name.localeCompare(b.name));
}
