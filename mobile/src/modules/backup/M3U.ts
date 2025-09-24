import { getActualPath } from "@missingcore/react-native-actual-path";
import { getDocumentAsync } from "expo-document-picker";
import { StorageAccessFramework as SAF } from "expo-file-system";

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
  // FIXME: Current version of `expo-file-system/next` doesn't support SAF.
  const documentFile = await SAF.readAsStringAsync(assets[0].uri);

  // List of "file names" in the playlist.
  const orderedTracks = documentFile
    .split(/\r?\n/)
    .filter((line) => !!line && !line.startsWith("#"));
  console.log(fileLocation);
  console.log(orderedTracks);
}
//#endregion
