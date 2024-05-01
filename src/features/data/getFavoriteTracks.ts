import { useQuery } from "@tanstack/react-query";

import { db } from "@/db";
import { formatTracksForTrackCard } from "@/db/utils/formatters";

import type { ExtractFnReturnType } from "@/lib/react-query";
import { getPlayTime } from "@/components/media/utils";
import { assortedDataKeys } from "./queryKeys";
import { SpecialPlaylists } from "../playback/utils/trackList";
import { getTrackCountStr } from "../track/utils";

async function getFavoriteTracks() {
  return await db.query.tracks.findMany({
    where: (fields, { eq }) => eq(fields.isFavorite, true),
    with: { album: true },
  });
}

type QueryFnType = typeof getFavoriteTracks;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Query we build upon to be exported. */
const useFavoriteTracksQuery = <TData = QueryFnData>(
  select?: (data: QueryFnData) => TData,
) =>
  useQuery({
    queryKey: assortedDataKeys.favoriteTracks,
    queryFn: getFavoriteTracks,
    // Data returned from `select` doesn't get saved to the cache.
    select,
    staleTime: Infinity,
  });

/**
 * @description Get favorite tracks & format it like the results returned
 *  from getting a single playlist.
 */
export const useFavoriteTracks = () =>
  useFavoriteTracksQuery((data: QueryFnData) => {
    const tracks = formatTracksForTrackCard({ type: "track", data });

    return {
      name: SpecialPlaylists.favorites,
      imageSource: SpecialPlaylists.favorites,
      tracks,
      metadata: [
        getTrackCountStr(tracks.length),
        getPlayTime(tracks.reduce((total, curr) => total + curr.duration, 0)),
      ],
    };
  });

/**
 * @description Get the current number of favorite tracks (abbreviates
 *  large values).
 */
export const useFavoriteTracksCount = () =>
  useFavoriteTracksQuery((data: QueryFnData) => data.length);
