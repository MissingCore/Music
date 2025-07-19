import { db } from "~/db";

import { iAsc } from "~/lib/drizzle";
import { addTrailingSlash } from "~/utils/string";
import type { Maybe } from "~/utils/types";

//#region GET Methods
/** Get the contents of a folder for a given path (excludes the `file:///` at the start). */
export async function getFolder(path: Maybe<string>) {
  return {
    subDirectories: await getFolderSubdirectories(path),
    tracks: await getFolderTracks(path),
  };
}

/** Get the direct non-empty subdirectories in a given folder. */
export async function getFolderSubdirectories(path: Maybe<string>) {
  const subDirs = await db.query.fileNodes.findMany({
    where: (fields, { eq, isNull }) =>
      path
        ? eq(fields.parentPath, addTrailingSlash(path))
        : isNull(fields.parentPath),
    orderBy: (fields) => iAsc(fields.name),
  });
  const dirHasChild = await Promise.all(
    subDirs.map(({ path: subDir }) =>
      db.query.tracks.findFirst({
        where: (fields, { and, like, isNull }) =>
          and(like(fields.uri, `file:///${subDir}%`), isNull(fields.hiddenAt)),
        columns: { id: true },
      }),
    ),
  );
  return subDirs
    .filter((_, idx) => !!dirHasChild[idx])
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        // So folder order is: "1-10", "11-20" instead of: "1-10", "101-110".
        numeric: true,
        caseFirst: "upper",
      }),
    );
}

/** Get the direct tracks in a given folder. */
export async function getFolderTracks(path: Maybe<string>) {
  if (!path) return [];
  return db.query.tracks.findMany({
    where: (fields, { and, eq, isNull }) =>
      and(
        eq(fields.parentFolder, `file:///${addTrailingSlash(path)}`),
        isNull(fields.hiddenAt),
      ),
    with: { album: true },
    orderBy: (fields) => iAsc(fields.name),
  });
}
//#endregion
