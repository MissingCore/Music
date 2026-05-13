import { getDocumentAsync } from "expo-document-picker";
import { File } from "expo-file-system";

import i18next from "~/modules/i18n";

import { pickDirectory } from "~/lib/file-system";
import type { ThemeExport } from "./zod";
import { ThemeExportSchema } from "./zod";
import type { CustomTheme, ThemeColors } from "../constants";

//#region Export
export async function exportTheme(theme: CustomTheme): Promise<void> {
  const dir = await pickDirectory();
  const file = dir.createFile("custom_theme", "application/json");
  file.write(
    JSON.stringify({
      name: theme.name,
      scheme: theme.scheme,
      colors: theme.colors,
    }),
  );
}
//#endregion

//#region Import
export async function readThemeFile(): Promise<ThemeExport> {
  const { assets, canceled } = await getDocumentAsync({
    type: ["application/json", "application/octet-stream", "text/plain"],
  });
  if (canceled) throw new Error(i18next.t("err.msg.actionCancel"));
  if (!assets[0]) throw new Error(i18next.t("err.msg.noSelect"));
  const documentFile = new File(assets[0].uri);

  try {
    const parsed = ThemeExportSchema.parse(
      JSON.parse(await documentFile.text()),
    );
    return {
      name: parsed.name,
      scheme: parsed.scheme,
      colors: parsed.colors as ThemeColors,
    };
  } catch {
    throw new Error(i18next.t("err.msg.invalidStructure"));
  } finally {
    documentFile.delete();
  }
}
//#endregion
