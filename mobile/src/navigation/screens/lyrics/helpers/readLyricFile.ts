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

  const lrcFile = new File(assets[0].uri);
  return {
    name: lrcFile.name.split(".")[0],
    contents: await lrcFile.text(),
  };
}
