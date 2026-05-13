import { useQuery } from "@tanstack/react-query";

import { db } from "~/db";

const queryKey = ["custom-fonts"] as const;

//#region API
export async function getCustomFonts() {
  return db.query.customFonts.findMany({
    orderBy: (fields, { asc }) => asc(fields.name),
  });
}
//#endregion

//#region Queries
export function useCustomFonts() {
  return useQuery({ queryKey, queryFn: getCustomFonts });
}
//#endregion
