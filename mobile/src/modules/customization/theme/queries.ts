import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";

import { db } from "~/db";
import { customThemes } from "./core/schema";

import { throwIfNoResults } from "~/lib/drizzle";
import { queryClient } from "~/lib/react-query";
import type { ResolvedTheme } from "./constants";

const queryKey = ["custom-themes"] as const;

type CustomThemeEntry = typeof customThemes.$inferSelect;

//#region API
async function getCustomTheme(id: string) {
  const result = await throwIfNoResults(
    db.query.customThemes.findFirst({
      where: (fields, { eq }) => eq(fields.id, id),
    }),
  );
  return result as ResolvedTheme & { id: string; name: string };
}

async function getCustomThemes() {
  return db.query.customThemes.findMany({
    orderBy: (fields, { asc }) => asc(fields.name),
  });
}

export async function createCustomTheme(entry: Omit<CustomThemeEntry, "id">) {
  return db.insert(customThemes).values(entry);
}

export async function updateCustomTheme(
  id: string,
  values: Partial<Omit<CustomThemeEntry, "id">>,
) {
  return db.update(customThemes).set(values).where(eq(customThemes.id, id));
}

export async function deleteCustomTheme(id: string) {
  return db.delete(customThemes).where(eq(customThemes.id, id));
}
//#endregion

//#region Queries
export function revalidateCustomThemes() {
  queryClient.invalidateQueries({ queryKey });
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
