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
    saveErrors: await db.$count(invalidTracks),
    totalDuration:
      Number(
        (await db.select({ total: sum(tracks.duration) }).from(tracks))[0]
          ?.total,
      ) || 0,
  };
}

/** Get the latest stable & pre-release release notes from GitHub. */
export async function getLatestRelease() {
  return {
    latestStable: await fetch(`${RELEASE_NOTES_LINK}/latest`)
      .then((res) => res.json())
      .then((data) => formatGitHubRelease(data)),
    latestRelease: await fetch(`${RELEASE_NOTES_LINK}?per_page=1`)
      .then((res) => res.json())
      .then(([data]) => formatGitHubRelease(data)),
  };
}

/** Get the list of tracks we failed to save along with their error message. */
export async function getSaveErrors() {
  return db.query.invalidTracks.findMany();
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
const RELEASE_NOTES_LINK =
  "https://api.github.com/repos/MissingCore/Music/releases";

type ReleaseNotes =
  | { releaseNotes: undefined; version: undefined }
  | { releaseNotes: string; version: string };

/** Formats the data returned from the GitHub API. */
function formatGitHubRelease(data: any): ReleaseNotes {
  return {
    version: data.tag_name,
    // Remove markdown comments w/ regex.
    releaseNotes: data.body
      ? data.body.replace(/<!--[\s\S]*?(?:-->)/g, "")
      : undefined,
  };
}

/** Gets the size of a directory. */
function getDirectorySize(dir: Directory): number {
  if (!dir.exists) return 0;
  return dir.list().reduce((prev, file) => {
    if (isFile(file)) return prev + (file.size ?? 0);
    else return prev + getDirectorySize(file);
  }, 0);
}
//#endregion
