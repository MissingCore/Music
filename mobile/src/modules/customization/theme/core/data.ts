import { getDocumentAsync } from "expo-document-picker";
import { File } from "expo-file-system";

import { z } from "zod/mini";

import i18next from "~/modules/i18n";

import { pickDirectory } from "~/lib/file-system";
import { ZSchema } from "~/modules/form/utils";
import type { CustomTheme, ThemeColors } from "./constants";
import { ColorSchemeOptions } from "./constants";
import { ColorRoleZodMap } from "./utils";

//#region Backup
const ThemeExportSchema = z.object({
  name: ZSchema.NonEmptyString,
  scheme: z.enum(ColorSchemeOptions),
  colors: z.object(ColorRoleZodMap),
});

type ThemeExport = z.infer<typeof ThemeExportSchema>;

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
