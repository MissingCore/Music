import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { db } from "@/db";
import type { TrackWithAlbum } from "@/db/schema";
import { getTrackCover } from "@/db/utils/formatters";
import { trackKeys } from "./_queryKeys";

import { pickKeys } from "@/utils/object";
import type { Prettify } from "@/utils/types";

type BaseFnArgs = { trackId: string };

type QueryFnData = TrackWithAlbum;

export async function getTrack({ trackId }: BaseFnArgs) {
  const currentTrack = await db.query.tracks.findFirst({
    where: (fields, { eq }) => eq(fields.id, trackId),
    with: { album: true },
  });
  if (!currentTrack) throw new Error(`Track ${trackId} doesn't exist.`);
  return currentTrack;
}

type UseTrackOptions<TData = QueryFnData> = Prettify<
  BaseFnArgs & {
    config?: {
      select?: (data: QueryFnData) => TData;
    };
  }
>;

/** @description Returns specified track. */
export const useTrack = <TData = QueryFnData>({
  trackId,
  config,
}: UseTrackOptions<TData>) => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: trackKeys.detail(trackId),
    queryFn: () => getTrack({ trackId }),
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
