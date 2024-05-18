import { queryOptions, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { getTracks } from "@/db/queries";
import { formatTracksForTrack } from "@/db/utils/formatters";
import { trackKeys } from "./_queryKeys";

import type { ExtractFnReturnType } from "@/utils/types";

type QueryFnData = ExtractFnReturnType<typeof getTracks>;

/** @description Returns all tracks. */
export const tracksOptions = () =>
  queryOptions({
    queryKey: trackKeys.all,
    queryFn: () => getTracks(),
    staleTime: Infinity,
  });

/** @description Returns a list of `TrackCardContent` generated from tracks. */
export const useTracksForTrackCard = () =>
  useQuery({
    ...tracksOptions(),
    select: useCallback(
      (data: QueryFnData) => formatTracksForTrack({ type: "track", data }),
      [],
    ),
  });
