import { SpecialPlaylists } from "../playback/utils/trackList";

/** @description Query keys for queries in this file. */
export const assortedDataKeys = {
  favoriteLists: [{ entity: "favorite-lists" }] as const,
  favoriteTracks: [{ entity: SpecialPlaylists.favorites }] as const,
};
