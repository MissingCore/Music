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

  const documentFile = new File(assets[0].uri);
  const lyricInfo = {
    name: documentFile.name.split(".").slice(0, -1).join("."),
    contents: await documentFile.text(),
  };

  return lyricInfo;
}
