import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { db } from "~/db";
import type { SlimFolder, SlimTrackWithAlbum } from "~/db/slimTypes";

import { getAlbums } from "~/api/album";
import { getArtists } from "~/api/artist";
import { getPlaylists } from "~/api/playlist";
import { getTracks } from "~/api/track";

import { addTrailingSlash } from "~/utils/string";
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
    const q = query.toLocaleLowerCase();
    return Object.fromEntries(
      scope.map((mediaType) => {
        const filteredResults = data[mediaType].filter(
          (i) =>
            // Partial match with the `name` field.
            i.name.toLocaleLowerCase().includes(q) ||
            // Album's or track's artist name starts with the query.
            // prettier-ignore
            // @ts-expect-error - We ensured the `artistName` field is present.
            (!!i.artistName && i.artistName.toLocaleLowerCase().startsWith(q)) ||
            // Track's album starts with the query.
            // @ts-expect-error - We ensured the `album` field is present.
            (!!i.album && i.album.name.toLocaleLowerCase().startsWith(q)) ||
            // Folder's path includes the query.
            // @ts-expect-error - We ensured the `path` field is present.
            (!!i.path && i.path.toLocaleLowerCase().includes(q)),
        );

        // Have results that start with the query first.
        const goodMatch = Array<(typeof filteredResults)[number]>();
        const partialMatch = Array<(typeof filteredResults)[number]>();
        filteredResults.forEach((data) => {
          if (data.name.toLocaleLowerCase().startsWith(q)) goodMatch.push(data);
          else partialMatch.push(data);
        });

        return [mediaType, goodMatch.concat(partialMatch)];
      }),
    ) as Pick<SearchResults, TScope[number]>;
  }, [data, query, scope]);
}

//#region Helpers
async function getAllMedia() {
  // Maybe manually building the query would be faster, but would be a bit
  // too complicated to read.
  const [allTracks, allFolders] = await Promise.all([
    getTracks({
      columns: ["id", "name", "artistName", "artwork", "parentFolder"],
      albumColumns: ["name", "artwork"],
    }),
    db.query.fileNodes.findMany({
      orderBy: (f, { asc }) => [asc(f.parentPath), asc(f.name)],
    }),
  ]);

  // Pre-group the tracks by their `parentFolder` to make things a lot faster.
  const groupedTracks: Record<string, SlimTrackWithAlbum[]> = {};
  allTracks.forEach(({ parentFolder, ...t }) => {
    if (!parentFolder) return;

    if (groupedTracks[parentFolder]) groupedTracks[parentFolder].push(t);
    else groupedTracks[parentFolder] = [t];
  });

  return {
    album: await getAlbums({
      columns: ["id", "name", "artistName", "artwork"],
      trackColumns: ["id", "name", "artistName", "artwork"],
    }),
    artist: await getArtists({
      columns: ["name", "artwork"],
      withTracks: false,
    }),
    folder: (allFolders as SlimFolder[])
      .map((f) => {
        f.tracks = groupedTracks[`file:///${addTrailingSlash(f.path)}`] ?? [];
        return f;
      })
      .filter(({ tracks }) => tracks.length > 0),
    playlist: await getPlaylists({
      columns: ["name", "artwork"],
      trackColumns: ["artwork"],
      albumColumns: ["artwork"],
    }),
    track: allTracks.map(({ parentFolder: _, ...t }) => t),
  } satisfies SearchResults;
}

const queryKey = ["search"];

function useAllMedia() {
  // We can perpetually cache this data since track deletion will clear this
  // query. For other places (ie: modifying playlists), we can manually add
  // that in.
  //  - FIXME: If we add the "Hide Track" feature, things might need to change.
  return useQuery({ queryKey, queryFn: getAllMedia });
}
//#endregion
