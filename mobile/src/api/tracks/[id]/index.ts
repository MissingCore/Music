import { queryOptions, useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { useCallback } from "react";

import { tracks } from "@/db/schema";
import { getTrack } from "@/db/queries";
import { trackKeys } from "../_queryKeys";

import { pickKeys } from "@/utils/object";
import type { ExtractFnReturnType } from "@/utils/types";

type QueryFnData = ExtractFnReturnType<typeof getTrack>;

/** Returns specified track. */
export const trackOptions = (trackId: string) =>
  queryOptions({
    queryKey: trackKeys.detail(trackId),
    queryFn: () => getTrack([eq(tracks.id, trackId)]),
    staleTime: Infinity,
  });

/** Return the most-used subset of track data. */
export const useTrackExcerpt = (trackId: string) =>
  useQuery({
    ...trackOptions(trackId),
    select: useCallback(
      (data: QueryFnData) => ({
        ...pickKeys(data, [
          ...["id", "name", "artistName", "duration", "isFavorite"],
        ] as const),
        album: data.album ? pickKeys(data.album, ["id", "name"]) : null,
        imageSource: data.artwork,
      }),
      [],
    ),
  });
