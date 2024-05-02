import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { getTracks } from "@/db/queries";
import { formatTracksForTrackCard } from "@/db/utils/formatters";
import { trackKeys } from "./_queryKeys";

import type { ExtractFnReturnType } from "@/utils/types";

type QueryFnData = ExtractFnReturnType<typeof getTracks>;

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
    queryFn: () => getTracks(),
    staleTime: Infinity,
    ...config,
  });

/** @description Returns a list of `TrackCardContent` generated from tracks. */
export const useTracksForTrackCard = () =>
  useTracks({
    config: {
      select: useCallback(
        (data: QueryFnData) =>
          formatTracksForTrackCard({ type: "track", data }),
        [],
      ),
    },
  });
