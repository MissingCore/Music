import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { db } from "@/db";
import type { TrackWithAlbum } from "@/db/schema";
import { formatTracksForTrackCard } from "@/db/utils/formatters";
import { trackKeys } from "./_queryKeys";

type QueryFnData = TrackWithAlbum[];

export async function getTracks() {
  return await db.query.tracks.findMany({ with: { album: true } });
}

type UseTracksOptions<TData = QueryFnData> = {
  config?: {
    select?: (data: QueryFnData) => TData;
  };
};

/** @description Returns all tracks. */
export const useTracks = <TData = QueryFnData>({
  config,
}: UseTracksOptions<TData>) =>
  useQuery({
    queryKey: trackKeys.all,
    queryFn: getTracks,
    staleTime: Infinity,
    ...config,
  });

/** @description Returns a list of `TrackCardContent` generated from tracks. */
export const useTracksForTrackCards = () =>
  useTracks({
    config: {
      select: useCallback(
        (data: QueryFnData) =>
          formatTracksForTrackCard({ type: "track", data }),
        [],
      ),
    },
  });
