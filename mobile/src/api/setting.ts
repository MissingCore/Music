import { sum } from "drizzle-orm";
import { Directory, Paths } from "expo-file-system/next";

import { db } from "~/db";
import { albums, artists, invalidTracks, playlists, tracks } from "~/db/schema";

import { ImageDirectory, isFile } from "~/lib/file-system";

//#region GET Methods
/** A summary of what's stored in the database. */
export async function getDatabaseSummary() {
  const imgDir = new Directory(ImageDirectory);
  return {
    albums: await db.$count(albums),
    artists: await db.$count(artists),
    images: imgDir.exists ? imgDir.list().length : 0,
    playlists: await db.$count(playlists),
    tracks: await db.$count(tracks),
    hiddenTracks: (
      await db.query.tracks.findMany({
        where: (fields, { isNotNull }) => isNotNull(fields.hiddenAt),
        columns: { id: true },
      })
    ).length,
    saveErrors: await db.$count(invalidTracks),
    totalDuration:
      Number(
        (await db.select({ total: sum(tracks.duration) }).from(tracks))[0]
          ?.total,
      ) || 0,
  };
}

/** A summary of what consists of "user data" that's stored by the app. */
export async function getStorageSummary() {
  const dbSize = getDirectorySize(new Directory(Paths.document, "SQLite"));
  const imgSize = getDirectorySize(new Directory(ImageDirectory));
  const otherSize = getDirectorySize(new Directory(Paths.document));
  const cacheSize = getDirectorySize(new Directory(Paths.cache));

  return {
    images: imgSize,
    database: dbSize,
    other: otherSize - imgSize - dbSize,
    cache: cacheSize,
    total: otherSize + cacheSize,
  };
}
//#endregion

//#region Internal Utils
/** Gets the size of a directory. */
function getDirectorySize(dir: Directory): number {
  if (!dir.exists) return 0;
  return dir.list().reduce((prev, file) => {
    if (isFile(file)) return prev + (file.size ?? 0);
    else return prev + getDirectorySize(file);
  }, 0);
}
//#endregion
