import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { db } from "@/db";
import { formatTracksForTrack } from "@/db/utils/formatters";
import { fileNodeKeys } from "./_queryKeys";

import { addTrailingSlash } from "@/utils/string";
import type { ExtractFnReturnType } from "@/utils/types";

export async function getFolderTracks(path: string) {
  const fullPath = `file:///${path}`;
  return (
    await db.query.tracks.findMany({
      where: (fields, { like }) => like(fields.uri, `${fullPath}%`),
      with: { album: true },
      orderBy: (fields, { asc }) => asc(fields.name),
    })
  ).filter(({ uri }) => !uri.slice(fullPath.length).includes("/"));
}

export async function getFolderSubdirectories(path: string | null) {
  const nodes = await db.query.fileNodes.findMany({
    where: (fields, { eq, isNull }) =>
      path ? eq(fields.parentPath, path) : isNull(fields.parentPath),
    orderBy: (fields, { asc }) => asc(fields.name),
  });
  const hasChild = await Promise.all(
    nodes.map(({ path: subDir }) =>
      db.query.tracks.findFirst({
        where: (fields, { like }) => like(fields.uri, `file:///${subDir}%`),
        columns: { id: true },
      }),
    ),
  );
  return nodes.filter((_, idx) => hasChild[idx] !== undefined);
}

export async function getFolderInfo(path: string | null) {
  return {
    subDirectories: await getFolderSubdirectories(path),
    // Assume no tracks are in the "root" (when `path = null`) as this
    // could break some things.
    tracks: path ? await getFolderTracks(path) : [],
  };
}

type QueryFnData = ExtractFnReturnType<typeof getFolderInfo>;

/** Get the list of subdirectories & tracks in this music directory. */
export const useFolderContentForPath = (path?: string) =>
  useQuery({
    queryKey: fileNodeKeys.detail(path ?? ".root"),
    queryFn: () => getFolderInfo(path ? addTrailingSlash(path) : null),
    select: useCallback(
      ({ subDirectories, tracks }: QueryFnData) => ({
        subDirectories,
        tracks: formatTracksForTrack({ type: "track", data: tracks }),
      }),
      [],
    ),
  });
