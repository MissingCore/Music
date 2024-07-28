import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { db } from "@/db";
import { formatTracksForTrack } from "@/db/utils/formatters";
import { fileNodeKeys } from "./_queryKeys";

import type { ExtractFnReturnType } from "@/utils/types";
import { addTrailingSlash } from "@/features/indexing/utils";

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

export async function getFolderSubdirectories(path: string) {
  const fileNodes = await db.query.fileNode.findMany({
    where: (fields, { eq }) => eq(fields.parentPath, path),
    orderBy: (fields, { asc }) => asc(fields.name),
  });
  const hasChild = await Promise.all(
    fileNodes.map(({ path }) =>
      db.query.tracks.findFirst({
        where: (fields, { like }) => like(fields.uri, `file:///${path}%`),
        columns: { id: true },
      }),
    ),
  );
  return fileNodes.filter((_, idx) => hasChild[idx] !== undefined);
}

export async function getFolderInfo(path: string) {
  return {
    subDirectories: await getFolderSubdirectories(path),
    tracks: await getFolderTracks(path),
  };
}

type QueryFnData = ExtractFnReturnType<typeof getFolderInfo>;

/** Get the list of subdirectories & tracks in this music directory. */
export const useFolderContentForPath = (path: string) =>
  useQuery({
    queryKey: fileNodeKeys.detail(path),
    queryFn: () => getFolderInfo(addTrailingSlash(path)),
    select: useCallback(
      ({ subDirectories, tracks }: QueryFnData) => ({
        subDirectories,
        tracks: formatTracksForTrack({ type: "track", data: tracks }),
      }),
      [],
    ),
  });
