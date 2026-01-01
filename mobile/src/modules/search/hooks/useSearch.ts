import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { db } from "~/db";
import type { SlimFolder, SlimTrackWithAlbum } from "~/db/slimTypes";

import { getAlbums } from "~/api/album";
import { getPlaylists } from "~/api/playlist";
import { getTracks } from "~/api/track";

import { iAsc } from "~/lib/drizzle";
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
            // Album's artist name starts with the query.
            // prettier-ignore
            // @ts-expect-error - We ensured the `artistName` field is present.
            (mediaType === "album" && !!i.artistName && i.artistName.toLocaleLowerCase().startsWith(q)) ||
            // One of track's artist names starts with the query.
            // prettier-ignore
            // @ts-expect-error - We ensured the `artistName` field is present.
            (!!i.tracksToArtists && i.tracksToArtists.some(({ artistName }) => artistName.toLocaleLowerCase().startsWith(q))) ||
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
  const [allAlbums, allArtists, allFolders, allPlaylists, allTracks] =
    await Promise.all([
      getAlbums({
        columns: ["id", "name", "artistName", "artwork"],
        trackColumns: ["id", "name", "artwork"],
      }),
      db.query.artists.findMany({
        orderBy: (fields) => iAsc(fields.name),
        //? Relation used to filter out artists with no tracks.
        with: { tracksToArtists: { columns: { trackId: true }, limit: 1 } },
      }),
      db.query.fileNodes.findMany({
        orderBy: (f, { asc }) => [asc(f.parentPath), asc(f.name)],
      }),
      getPlaylists({
        columns: ["name", "artwork"],
        trackColumns: ["artwork"],
        albumColumns: ["artwork"],
      }),
      getTracks({
        columns: ["id", "name", "artwork", "parentFolder"],
        albumColumns: ["name", "artwork"],
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
    album: allAlbums.filter(({ tracks }) => tracks.length > 0),
    artist: allArtists
      .filter(({ tracksToArtists }) => tracksToArtists.length > 0)
      .map(({ tracksToArtists: _, ...artist }) => artist),
    folder: (allFolders as SlimFolder[])
      .map((f) => {
        f.tracks = groupedTracks[`file:///${addTrailingSlash(f.path)}`] ?? [];
        return f;
      })
      .filter(({ tracks }) => tracks.length > 0),
    playlist: allPlaylists.map(({ tracks, ...playlist }) => ({
      ...playlist,
      tracks: tracks.map(({ tracksToArtists: _, ...track }) => track),
    })),
    track: allTracks.map(({ parentFolder: _, ...t }) => t),
  } satisfies SearchResults;
}

const queryKey = ["search"];

function useAllMedia() {
  return useQuery({ queryKey, queryFn: getAllMedia });
}
//#endregion
