import { atom } from "jotai";
import { unwrap } from "jotai/utils";

import { db } from "@/db";

/*
  Pattern for having a read-write atom that starts with asynchronous data.

  Idea Inspiration: https://twitter.com/dai_shi/status/1722543472874594334
*/

const baseAtom = atom<Set<string> | undefined>(undefined);

const asyncAtom = atom(async () => {
  const playlistNames = await db.query.playlists.findMany({
    columns: { name: true },
  });
  return new Set(playlistNames.map(({ name }) => name));
});
const syncAtom = unwrap(asyncAtom, (prev) => prev ?? new Set<string>());

type Actions = { type: "add" | "delete"; name: string };

/** @description List of all playlist names. */
export const usedPlaylistNamesAtom = atom(
  (get) => get(baseAtom) ?? get(syncAtom),
  (get, set, { type, name }: Actions) =>
    set(baseAtom, (prev) => {
      const data = prev ?? get(syncAtom);
      if (type === "add") data.add(name);
      else data.delete(name);
      return data;
    }),
);
