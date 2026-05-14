import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import { getDocumentAsync } from "expo-document-picker";
import { File } from "expo-file-system";
import { z } from "zod/mini";

import { db } from "~/db";
import { customThemes } from "./schema";

import i18next from "~/modules/i18n";

import { throwIfNoResults } from "~/lib/drizzle";
import { pickDirectory } from "~/lib/file-system";
import { queryClient } from "~/lib/react-query";
import { ZSchema } from "~/modules/form/utils";
import type { CustomTheme, ResolvedTheme } from "./constants";
import { ColorSchemeOptions } from "./constants";
import { ColorRoleZodMap } from "./utils";

const queryKey = ["custom-themes"] as const;

//? Raw structure stored in `customThemes` table. Not to be confused with
//? the `CustomTheme` type which is the consumed structure.
type CustomThemeEntry = typeof customThemes.$inferSelect;

//#region Backup
const ThemeExportSchema = z.object({
  name: ZSchema.NonEmptyString,
  scheme: z.enum(ColorSchemeOptions),
  colors: z.object(ColorRoleZodMap),
});

export async function pickTheme() {
  const { assets, canceled } = await getDocumentAsync({
    type: ["application/json", "application/octet-stream", "text/plain"],
    copyToCacheDirectory: false,
  });
  if (canceled) throw new Error(i18next.t("err.msg.actionCancel"));
  if (!assets[0]) throw new Error(i18next.t("err.msg.noSelect"));

  try {
    const fileContents = await new File(assets[0].uri).text();
    return ThemeExportSchema.parse(JSON.parse(fileContents));
  } catch {
    throw new Error(i18next.t("err.msg.invalidStructure"));
  }
}

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

//#region Theme Management
export async function saveCustomTheme(entry: Omit<CustomThemeEntry, "id">) {
  await db.insert(customThemes).values(entry);
  queryClient.invalidateQueries({ queryKey });
}

export async function deleteCustomTheme(themeId: string) {
  await db.delete(customThemes).where(eq(customThemes.id, themeId));
  queryClient.invalidateQueries({ queryKey });
}

export async function updateCustomTheme(
  id: string,
  values: Partial<Omit<CustomThemeEntry, "id">>,
) {
  await db.update(customThemes).set(values).where(eq(customThemes.id, id));
  queryClient.invalidateQueries({ queryKey });
}
//#endregion

//#region Theme Querying
export async function getCustomTheme(themeId: string) {
  const result = await throwIfNoResults(
    db.query.customThemes.findFirst({
      where: (fields, { eq }) => eq(fields.id, themeId),
    }),
  );
  return result as ResolvedTheme & { id: string; name: string };
}

async function getCustomThemes() {
  return db.query.customThemes.findMany({
    orderBy: (fields, { asc }) => asc(fields.name),
  });
}

export function useCustomTheme(themeId: string) {
  return useQuery({
    queryKey: [...queryKey, themeId],
    queryFn: () => getCustomTheme(themeId),
  });
}

export function useCustomThemes() {
  return useQuery({ queryKey, queryFn: getCustomThemes });
}
//#endregion
