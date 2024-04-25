import { useQuery } from "@tanstack/react-query";

import { db } from "@/db";

import type { ExtractFnReturnType } from "@/lib/react-query";
import { playlistKeys } from "./queryKeys";

async function getPlaylists() {
  return await db.query.playlists.findMany({
    with: {
      tracksToPlaylists: {
        columns: { trackId: false, playlistName: false },
        with: {
          track: {
            with: { album: true },
          },
        },
      },
    },
  });
}

type QueryFnType = typeof getPlaylists;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Gets all playlists with its relations. */
export const usePlaylists = () =>
  useQuery({
    queryKey: playlistKeys.all,
    queryFn: getPlaylists,
    // Data returned from `select` doesn't get saved to the cache.
    select: formatPlaylists,
    staleTime: Infinity,
  });

/** @description Summarize information about each playlist. */
function formatPlaylists(data: QueryFnData) {
  return data
    .map(({ name, coverSrc, tracksToPlaylists }) => {
      const coverCollage = tracksToPlaylists
        .toSorted((a, b) => a.track.name.localeCompare(b.track.name))
        .slice(0, 4)
        .map(({ track }) => track.album?.coverSrc ?? track.coverSrc);

      return {
        ...{ name, coverSrc: coverSrc ?? coverCollage },
        numTracks: tracksToPlaylists.length,
      };
    })
    .toSorted((a, b) => a.name.localeCompare(b.name));
}
