import { eq } from "drizzle-orm";
import { atom } from "jotai";
import { unwrap } from "jotai/utils";

import type { PlaylistWithTracks } from "@/db/schema";
import { albums, artists, playlists } from "@/db/schema";
import {
  getAlbum,
  getArtist,
  getPlaylist,
  getSpecialPlaylist,
} from "@/db/queries";
import { formatForMediaCard } from "@/db/utils/formatters";

import { SpecialPlaylists } from "../constants";
import type { TrackListSource } from "../types";

import { createAtomWithStorage } from "@/lib/jotai";
import { isFulfilled } from "@/utils/promise";

/** [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] List of up to 10 `TrackListSource` that we've played. */
export const recentlyPlayedAsyncAtom = createAtomWithStorage<TrackListSource[]>(
  "recently-played",
  [],
);

/** [🇫🇴🇷 🇮🇳🇹🇪🇷🇳🇦🇱 🇺🇸🇪 🇴🇳🇱🇾] Information about the recently played media. */
const recentlyPlayedDataAsyncAtom = atom(async (get) => {
  const recentlyPlayed = await get(recentlyPlayedAsyncAtom);
  return (await Promise.allSettled(recentlyPlayed.map(getRecentMediaInfo)))
    .filter(isFulfilled)
    .map(({ value }) => value);
});
/** Info about the recently played media. */
export const recentlyPlayedDataAtom = unwrap(
  recentlyPlayedDataAsyncAtom,
  (prev) => prev ?? [],
);

/** Information about media formatted as `MediaCardContent`. */
async function getRecentMediaInfo({ type, id }: TrackListSource) {
  if (type === "folder") throw new Error("Unsupported.");

  if (type === "album") {
    const data = await getAlbum([eq(albums.id, id)]);
    return formatForMediaCard({ type: "album", data });
  } else if (type === "artist") {
    const data = await getArtist([eq(artists.name, id)]);
    return formatForMediaCard({ type: "artist", data });
  } else {
    let data: PlaylistWithTracks;
    if (id === SpecialPlaylists.favorites) {
      data = await getSpecialPlaylist(SpecialPlaylists.favorites);
    } else if (id === SpecialPlaylists.tracks) {
      data = await getSpecialPlaylist(SpecialPlaylists.tracks);
    } else {
      data = await getPlaylist([eq(playlists.name, id)]);
    }
    return formatForMediaCard({ type: "playlist", data });
  }
}
