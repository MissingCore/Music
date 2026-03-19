import { getActualPath } from "@missingcore/react-native-actual-path";
import { getDocumentAsync } from "expo-document-picker";
import { File } from "expo-file-system";

import i18next from "~/modules/i18n";

export async function readLyricFile() {
  const { assets, canceled } = await getDocumentAsync({
    type: ["application/lrc", "text/plain"],
    copyToCacheDirectory: false,
  });
  if (canceled) throw new Error(i18next.t("err.msg.actionCancel"));
  if (!assets[0]) throw new Error(i18next.t("err.msg.noSelect"));

  const fileLocation = await getActualPath(assets[0].uri);
  if (!fileLocation) throw new Error(i18next.t("err.flow.generic.title"));

  return {
    name: fileLocation.split("/").at(-1)?.split(".")[0],
    contents: await new File(assets[0].uri).text(),
  };
}
