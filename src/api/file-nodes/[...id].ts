import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import { db } from "@/db";
import { formatTracksForTrack } from "@/db/utils/formatters";
import { fileNodeKeys } from "./_queryKeys";

import type { ExtractFnReturnType } from "@/utils/types";
import { MUSIC_DIRECTORY } from "@/features/indexing/Config";

export async function getFolderInfo(path: string) {
  const fullPath = `${MUSIC_DIRECTORY}${path.slice(6)}`;
  const fileRegex = new RegExp(`^${fullPath}(?!.*/).*$`);

  return {
    subDirectories: await db.query.fileNode.findMany({
      where: (fields, { eq }) => eq(fields.parentPath, path),
      orderBy: (fields, { asc }) => asc(fields.name),
    }),
    tracks: (
      await db.query.tracks.findMany({
        where: (fields, { like }) => like(fields.uri, `${fullPath}%`),
        with: { album: true },
        orderBy: (fields, { asc }) => asc(fields.name),
      })
    ).filter(({ uri }) => fileRegex.test(uri)),
  };
}

type QueryFnData = ExtractFnReturnType<typeof getFolderInfo>;

/** Get the list of subdirectories & tracks in this music directory. */
export const useFolderContentForPath = (path: string) =>
  useQuery({
    queryKey: fileNodeKeys.detail(path),
    queryFn: () => getFolderInfo(path.endsWith("/") ? path : `${path}/`),
    select: useCallback(
      ({ subDirectories, tracks }: QueryFnData) => ({
        subDirectories,
        tracks: formatTracksForTrack({ type: "track", data: tracks }),
      }),
      [],
    ),
  });
