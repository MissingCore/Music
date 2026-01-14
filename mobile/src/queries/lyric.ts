import { useQuery } from "@tanstack/react-query";

import { queries as q } from "./keyStore";

//#region Queries
export function useLyric(lyricId: string) {
  return useQuery({ ...q.lyrics.detail(lyricId) });
}

export function useLyrics() {
  return useQuery({ ...q.lyrics.all });
}
//#endregion
