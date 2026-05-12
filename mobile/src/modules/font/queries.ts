import { useQuery } from "@tanstack/react-query";
import { eq } from "drizzle-orm";

import { db } from "~/db";
import type { CustomFont } from "./schema";
import { customFonts } from "./schema";

import { queryClient } from "~/lib/react-query";

const queryKey = ["custom-fonts"] as const;

//#region API
export async function getCustomFonts() {
  return db.query.customFonts.findMany({
    orderBy: (fields, { asc }) => asc(fields.name),
  });
}

export async function createCustomFont(entry: Omit<CustomFont, "id">) {
  return db.insert(customFonts).values(entry);
}

export async function deleteCustomFont(id: string) {
  return db.delete(customFonts).where(eq(customFonts.id, id));
}
//#endregion

//#region Queries
export function revalidateCustomFonts() {
  queryClient.invalidateQueries({ queryKey });
}

export function useCustomFonts() {
  return useQuery({ queryKey, queryFn: getCustomFonts });
}
//#endregion
