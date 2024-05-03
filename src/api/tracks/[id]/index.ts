import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useCallback } from "react";

import { tracks } from "@/db/schema";
import { getTrack } from "@/db/queries";
import { getTrackCover } from "@/db/utils/formatters";
import { trackKeys } from "../_queryKeys";

import { pickKeys } from "@/utils/object";
import type { ExtractFnReturnType } from "@/utils/types";

type QueryFnData = ExtractFnReturnType<typeof getTrack>;

type UseTrackOptions<TData = QueryFnData> = {
  trackId: string;
  config?: {
    select?: (data: QueryFnData) => TData;
  };
};

/** @description Returns specified track. */
export const useTrack = <TData = QueryFnData>({
  trackId,
  config,
}: UseTrackOptions<TData>) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: trackKeys.detail(trackId),
    queryFn: () => getTrack([eq(tracks.id, trackId)]),
    placeholderData: () => {
      return queryClient
        .getQueryData<QueryFnData[]>(trackKeys.all)
        ?.find((d) => d?.id === trackId);
    },
    staleTime: Infinity,
    ...config,
  });
};

/** @description Return the most-used subset of track data. */
export const useTrackExcerpt = (trackId: string) =>
  useTrack({
    trackId,
    config: {
      select: useCallback(
        (data: QueryFnData) => ({
          ...pickKeys(data, [
            ...["id", "name", "artistName", "duration", "isFavorite"],
          ] as const),
          album: data.album ? pickKeys(data.album, ["id", "name"]) : null,
          imageSource: getTrackCover(data),
        }),
        [],
      ),
    },
  });
