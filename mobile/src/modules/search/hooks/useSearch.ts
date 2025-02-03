import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { getAlbums } from "~/api/album";
import { getArtists } from "~/api/artist";
import { getPlaylists } from "~/api/playlist";
import { getTracks } from "~/api/track";

import type { Prettify } from "~/utils/types";
import type { SearchCategories, SearchResults } from "../types";

/** Returns media specified by query in the given scope. */
export function useSearch<TScope extends SearchCategories>(
  scope: TScope,
  query?: string,
): Prettify<Pick<SearchResults, TScope[number]>> | undefined {
  const { data } = useAllMedia();
  return useMemo(() => {
    if (!data || !query) return undefined;
    let q = query.toLocaleLowerCase();
    return Object.fromEntries(
      scope.map((mediaType) => [
        mediaType,
        data[mediaType].filter(
          (i) =>
            // Partial match with the `name` field.
            i.name.toLocaleLowerCase().includes(q) ||
            // Track's album starts with the query.
            // @ts-expect-error - We ensured the `album` field is present.
            (i.album && i.album.name.toLocaleLowerCase().startsWith(q)),
        ),
      ]),
    ) as Pick<SearchResults, TScope[number]>;
  }, [data, query, scope]);
}

//#region Helpers
async function getAllMedia() {
  return {
    album: await getAlbums(),
    artist: await getArtists(),
    playlist: await getPlaylists(),
    track: await getTracks(),
  };
}

const queryKey = ["search"];

function useAllMedia() {
  return useQuery({ queryKey, queryFn: getAllMedia });
}
//#endregion
