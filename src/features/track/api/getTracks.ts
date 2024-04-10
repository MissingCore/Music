import { useQuery } from "@tanstack/react-query";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { tracks } from "@/db/schema";

import type { ExtractFnReturnType } from "@/lib/react-query";

/** @description Fetch all tracks with their relations from database. */
export async function getTracks() {
  return await db.query.tracks.findMany({
    with: { artist: true, album: true },
    orderBy: [asc(tracks.name)],
  });
}

type QueryFnType = typeof getTracks;
type QueryFnData = ExtractFnReturnType<QueryFnType>;

/** @description Gets all tracks with its relations, unmodified. */
export const useTracksQuery = <TData = QueryFnData>(
  select?: (data: QueryFnData) => TData,
) =>
  useQuery({
    queryKey: ["all-tracks"],
    queryFn: getTracks,
    select,
  });

/** @description Return all tracks w/ their artist name & cover inherited from its album. */
export const useFormattedTracks = () =>
  useTracksQuery((data: QueryFnData) =>
    data.map(({ artist, album, coverSrc, ...rest }) => ({
      ...rest,
      artistName: artist.name,
      coverSrc: album?.coverSrc ?? coverSrc,
    })),
  );
