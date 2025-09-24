import { getActualPath } from "@missingcore/react-native-actual-path";
import { getDocumentAsync } from "expo-document-picker";
import { StorageAccessFramework as SAF } from "expo-file-system";
import { Paths } from "expo-file-system/next";

import { db } from "~/db";

import i18next from "~/modules/i18n";

//#region Import
export async function readM3UPlaylist() {
  // Select the `music_backup.m3u` file we'll be importing from.
  //  - We want the `content://` uri instead of the cached uri.
  const { assets, canceled } = await getDocumentAsync({
    type: ["audio/x-mpegurl"],
    copyToCacheDirectory: false,
  });
  if (canceled) throw new Error(i18next.t("err.msg.actionCancel"));
  if (!assets[0]) throw new Error(i18next.t("err.msg.noSelect"));
  // Using `getActualPath()` on `documentFile.uri` will give the wrong value.
  const fileLocation = await getActualPath(assets[0].uri);
  if (!fileLocation) throw new Error(i18next.t("err.flow.generic.title"));
  const fileDirectory = fileLocation.split("/").slice(0, -1).join("/");
  // FIXME: Current version of `expo-file-system/next` doesn't support SAF.
  const documentFile = await SAF.readAsStringAsync(assets[0].uri);

  // List of "file names" in the playlist.
  const trackPaths = documentFile
    .split(/\r?\n/)
    .filter((line) => !!line && !line.startsWith("#"));
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

  const playlistTracks = await db.query.tracks.findMany({
    where: (fields, { inArray }) => inArray(fields.uri, trackUris),
  });

  // Ensure found values are in order.
  const playlistTrackMap = Object.fromEntries(
    playlistTracks.map((t) => [t.uri, t]),
  );
  return trackUris.map((uri) => playlistTrackMap[uri]).filter((t) => !!t);
}
//#endregion
