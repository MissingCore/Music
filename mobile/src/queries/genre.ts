import { useQuery } from "@tanstack/react-query";

import { queries as q } from "./keyStore";

//#region Queries
export function useGenres() {
  return useQuery({
    ...q.genres.all,
    select: (data) =>
      data
        .filter(({ trackCount }) => trackCount > 0)
        .map((a) => ({ ...a, duration: Number(a.duration) || 0 }))
        .sort((a, b) => a.name.localeCompare(b.name)),
  });
}
//#endregion
