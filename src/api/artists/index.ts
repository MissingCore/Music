import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { getArtists } from "@/db/queries";
import { artistKeys } from "./_queryKeys";

import type { ExtractFnReturnType } from "@/utils/types";
import { getTrackCountStr } from "@/features/track/utils";

type QueryFnData = ExtractFnReturnType<typeof getArtists>;

type UseArtistsOptions<TData = QueryFnData> = {
  config?: {
    select?: (data: QueryFnData) => TData;
  };
};

/** @description Returns all artists with its tracks. */
export const useArtists = <TData = QueryFnData>({
  config,
}: UseArtistsOptions<TData>) =>
  useQuery({
    queryKey: artistKeys.all,
    queryFn: () => getArtists(),
    staleTime: Infinity,
    ...config,
  });

/** @description Returns a list of artists grouped by their first character. */
export const useArtistsForList = () =>
  useArtists({
    config: {
      select: useCallback((data: QueryFnData) => {
        // Group artists by their 1st character.
        const groupedArtists: Record<string, typeof data> = {};
        data.forEach((artist) => {
          const key = /[a-zA-Z]/.test(artist.name.charAt(0))
            ? artist.name.charAt(0).toUpperCase()
            : "#";
          if (Object.hasOwn(groupedArtists, key))
            groupedArtists[key].push(artist);
          else groupedArtists[key] = [artist];
        });

        // Convert object to array, sort by character key and artist name.
        return Object.entries(groupedArtists)
          .map(([key, arts]) => ({
            title: key,
            data: arts
              .map(({ name, tracks }) => {
                const textContent = [name, getTrackCountStr(tracks.length)];
                return { name, textContent: textContent as [string, string] };
              })
              .toSorted((a, b) =>
                a.name.localeCompare(b.name, undefined, { caseFirst: "upper" }),
              ),
          }))
          .toSorted((a, b) => a.title.localeCompare(b.title));
      }, []),
    },
  });
