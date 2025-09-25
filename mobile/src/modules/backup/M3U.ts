import { getActualPath } from "@missingcore/react-native-actual-path";
import { inArray } from "drizzle-orm";
import { getDocumentAsync } from "expo-document-picker";
import { StorageAccessFramework as SAF } from "expo-file-system";
import { Paths } from "expo-file-system/next";

import { db } from "~/db";
import { tracks } from "~/db/schema";
import { getPlaylist } from "~/api/playlist";
import { getTracks } from "~/api/track";

import i18next from "~/modules/i18n";

//#region Import
export async function readM3UPlaylist() {
  // Select the M3U file we'll be importing from.
  //  - We want the `content://` uri instead of the cached uri.
  const { assets, canceled } = await getDocumentAsync({
    type: ["audio/x-mpegurl"],
    copyToCacheDirectory: false,
  });
  if (canceled) throw new Error(i18next.t("err.msg.actionCancel"));
  if (!assets[0]) throw new Error(i18next.t("err.msg.noSelect"));

  const fileLocation = await getActualPath(assets[0].uri);
  if (!fileLocation) throw new Error(i18next.t("err.flow.generic.title"));

  const fileDirectory = fileLocation.split("/").slice(0, -1).join("/");
  const fileName = fileLocation.split("/").at(-1)?.split(".")[0];
  // FIXME: Current version of `expo-file-system/next` doesn't support SAF.
  const documentFile = await SAF.readAsStringAsync(assets[0].uri);

  // List of "file names" in the playlist.
  const trackPaths = documentFile
    .split(/\r?\n/)
    .filter((line) => !!line && !line.startsWith("#"))
    .map((line) => line.replace(/\\/g, "/"));
  if (trackPaths.length === 0) throw new Error(i18next.t("err.msg.noContent"));

  // Determine "strategy" (absolute or relative paths).
  let strategy: "absolute" | "relative" | "unmodified" = "relative";
  const slashStart = trackPaths[0]?.at(0) === "/";
  if (trackPaths[0]?.startsWith("file:///")) strategy = "unmodified";
  else {
    const testUri = `file://${slashStart ? "" : "/"}${trackPaths[0]}`;
    const track = await db.query.tracks.findFirst({
      where: (fields, { eq }) => eq(fields.uri, testUri),
    });
    if (track) strategy = "absolute";
  }

  // Get uris so we can search our database.
  const trackUris =
    strategy === "absolute"
      ? trackPaths.map((path) => `file://${slashStart ? "" : "/"}${path}`)
      : strategy === "relative"
        ? trackPaths.map((path) => `file://${Paths.join(fileDirectory, path)}`)
        : trackPaths;

  const playlistTracks = await getTracks({
    where: [inArray(tracks.uri, trackUris)],
    columns: ["id", "name", "artistName", "artwork", "uri"],
    albumColumns: ["name", "artwork"],
    withHidden: true,
  });

  // Ensure found values are in order.
  const playlistTrackMap = Object.fromEntries(
    playlistTracks.map((t) => [t.uri, t]),
  );
  return {
    name: fileName,
    tracks: trackUris.map((uri) => playlistTrackMap[uri]).filter((t) => !!t),
  };
}
//#endregion

//#region Export
export async function exportPlaylistAsM3U(id: string) {
  const playlist = await getPlaylist(id);

  // User selects location to put M3U file.
  const perms = await SAF.requestDirectoryPermissionsAsync();
  if (!perms.granted) throw new Error(i18next.t("err.msg.actionCancel"));

  // Create a new file in specified directory & write contents.
  const fileUri = await SAF.createFileAsync(
    perms.directoryUri,
    playlist.name,
    "application/x-mpegURL", // For specifically `.m3u8`.
  );

  // Get readable `file://` location from SAF uri.
  const fileLocation = await getActualPath(fileUri);
  if (!fileLocation) throw new Error(i18next.t("err.flow.generic.title"));
  const fileDirectory = fileLocation.split("/").slice(0, -1).join("/");

  // Get relative path to files in playlist from where we'll put this M3U file.
  const relativePaths = playlist.tracks.map((t) => {
    const uri = t.uri.slice(7); // Remove the `file://` at the front.
    return Paths.relative(fileDirectory, uri);
  });
  const fileContent = ["#EXTM3U"];
  playlist.tracks.forEach(({ name, artistName, duration }, idx) => {
    fileContent.push(`#EXTINF:${Math.round(duration)},${artistName} - ${name}`);
    fileContent.push(relativePaths[idx]!);
  });
  fileContent.push(""); // Add an empty line at the end of the file.

  // Write to file.
  await SAF.writeAsStringAsync(fileUri, fileContent.join("\r\n"));
}
//#endregion
