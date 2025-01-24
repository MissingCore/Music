import { sum } from "drizzle-orm";
import {
  cacheDirectory,
  documentDirectory,
  getInfoAsync,
  readDirectoryAsync,
} from "expo-file-system";

import { db } from "~/db";
import { albums, artists, invalidTracks, playlists, tracks } from "~/db/schema";

//#region GET Methods
/** A summary of what's stored in the database. */
export async function getDatabaseSummary() {
  if (!documentDirectory) throw new Error("Web not supported");

  const imgDir = documentDirectory + "images";
  const imgData = await getInfoAsync(imgDir);
  let imgCount = imgData.exists ? (await readDirectoryAsync(imgDir)).length : 0;

  return {
    albums: await db.$count(albums),
    artists: await db.$count(artists),
    images: imgCount,
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
  if (!documentDirectory) throw new Error("Web not supported");

  const dbData = await getInfoAsync(documentDirectory + "SQLite");
  const imgData = await getInfoAsync(documentDirectory + "images");
  const otherData = await getInfoAsync(documentDirectory);
  const cacheData = await getInfoAsync(`${cacheDirectory}`);

  const dbSize = dbData.exists ? dbData.size : 0;
  const imgSize = imgData.exists ? imgData.size : 0;
  const otherSize = otherData.exists ? otherData.size : 0;
  const cacheSize = cacheData.exists ? cacheData.size : 0;

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
//#endregion
