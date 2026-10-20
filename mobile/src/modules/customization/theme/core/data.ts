// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";
import * as v from "valibot";

import { db } from "~/db";
import { customThemes } from "~/db/schema";

import i18next from "~/modules/i18n";

import { throwIfNoResults } from "~/lib/drizzle";
import { pickDirectory, pickFile } from "~/lib/file-system";
import { queryClient } from "~/lib/react-query";
import { isRecord } from "~/utils/validation";
import { FormSchema } from "~/modules/form/utils";
import type { CustomTheme, ResolvedTheme } from "./constants";
import { ColorSchemeOptions } from "./constants";
import { ColorRoleSchemaMap } from "./utils";

const queryKey = ["custom-themes"] as const;

//? Raw structure stored in `customThemes` table. Not to be confused with
//? the `CustomTheme` type which is the consumed structure.
type CustomThemeEntry = typeof customThemes.$inferSelect;

//#region Backup
const ThemeExportSchema = v.object({
  name: FormSchema.NonEmptyString,
  scheme: v.picklist(ColorSchemeOptions),
  colors: v.object(ColorRoleSchemaMap),
});

export async function pickTheme() {
  const themeFile = await pickFile([
    "application/json",
    "application/octet-stream",
    "text/plain",
  ]);
  try {
    const fileContents = await themeFile.json();

    //! FIXME: Temporary compatibility layer to support importing old theme
    //! files as our schema is "strict" (requires all colors to be defined).
    if (isRecord(fileContents) && fileContents.colors) {
      if (!fileContents.colors.placeholder)
        fileContents.colors.placeholder = "#FFFFFF";
      if (!fileContents.colors.androidNavbar)
        fileContents.colors.androidNavbar = "#00000000";
    }

    return v.parse(ThemeExportSchema, fileContents);
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
