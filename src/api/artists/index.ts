import { queryOptions, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { getArtists } from "@/db/queries";
import { artistKeys } from "./_queryKeys";

import type { ExtractFnReturnType } from "@/utils/types";
import { getTrackCountStr } from "@/features/track/utils";

type QueryFnData = ExtractFnReturnType<typeof getArtists>;

/** @description Returns all artists with its tracks. */
export const artistsOptions = () =>
  queryOptions({
    queryKey: artistKeys.all,
    queryFn: () => getArtists(),
    staleTime: Infinity,
  });

/**
 * @description Returns a list of artists grouped by their first character.
 *  To be used with `<FlashList />` restructured to work as a `<SectionList />`.
 */
export const useArtistsForList = () =>
  useQuery({
    ...artistsOptions(),
    select: useCallback((data: QueryFnData) => {
      // Group artists by their 1st character.
      const groupedArtists: Record<string, typeof data> = {};
      data.forEach((artist) => {
        const key = /[a-zA-Z]/.test(artist.name.charAt(0))
          ? artist.name.charAt(0).toUpperCase()
          : "#";
        if (Object.hasOwn(groupedArtists, key))
          groupedArtists[key]!.push(artist);
        else groupedArtists[key] = [artist];
      });

      // Convert object to array, sort by character key and artist name,
      // then flatten to be used in a `<FlashList />`.
      return Object.entries(groupedArtists)
        .map(([key, arts]) => ({
          title: key,
          data: arts
            .map(({ name, tracks }) => {
              const textContent = [name, getTrackCountStr(tracks.length)];
              return { name, textContent: textContent as [string, string] };
            })
            .sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { caseFirst: "upper" }),
            ),
        }))
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(({ title, data }) => [title, ...data])
        .flat();
    }, []),
  });
