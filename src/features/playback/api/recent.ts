import { atom } from "jotai";
import { unwrap } from "jotai/utils";

import { db } from "@/db";

import { createAtomWithStorage } from "@/lib/jotai";
import { isFulfilled } from "@/utils/promise";
import type { MediaListType } from "@/components/media/types";
import { getTrackCountStr } from "@/features/track/utils";
import { SpecialPlaylists, TTrackSrc } from "../utils/trackList";

/** @description [FOR INTERNAL USE ONLY] List of up to 10 `TTrackSrc` that we've played. */
export const recentlyPlayedAsyncAtom = createAtomWithStorage<TTrackSrc[]>(
  "recently-played",
  [],
);

/** @description [FOR INTERNAL USE ONLY] Gets info about the recently played media. */
const recentlyPlayedDataAsyncAtom = atom(async (get) => {
  try {
    const recentlyPlayed = await get(recentlyPlayedAsyncAtom);
    return (await Promise.allSettled(recentlyPlayed.map(getRecentMediaInfo)))
      .filter(isFulfilled)
      .map(({ value }) => value);
  } catch (err) {
    return [];
  }
});
/** @description Info about the recently played media. */
export const recentlyPlayedDataAtom = unwrap(
  recentlyPlayedDataAsyncAtom,
  (prev) => prev ?? [],
);

type MediaInfo = {
  title: string;
  subtitle: string;
  extra?: string;
  imgSrc: string | null;
} & ({ type: MediaListType; ref: string } | { type: "track"; ref: null });

/** @description Gets enough info about media to be used with `<MediaCard />`. */
async function getRecentMediaInfo({
  type,
  ref,
}: TTrackSrc): Promise<MediaInfo> {
  if (type === "album") {
    const album = await db.query.albums.findFirst({
      where: (fields, { eq }) => eq(fields.id, ref),
      with: { tracks: { columns: { id: true } } },
    });
    if (!album) throw new Error("Album doesn't exist.");
    return {
      ...{ type, ref, title: album.name, subtitle: album.artistName },
      extra: `| ${getTrackCountStr(album.tracks.length)}`,
      imgSrc: album.coverSrc,
    };
  } else if (type === "artist") {
    const artist = await db.query.artists.findFirst({
      where: (fields, { eq }) => eq(fields.name, ref),
      with: { tracks: { columns: { id: true } } },
    });
    if (!artist) throw new Error("Artist doesn't exist.");
    return {
      ...{ type, ref, title: artist.name, imgSrc: null },
      subtitle: getTrackCountStr(artist.tracks.length),
    };
  } else {
    switch (ref) {
      case SpecialPlaylists.favorites: {
        const tracks = await db.query.tracks.findMany({
          where: (fields, { eq }) => eq(fields.isFavorite, true),
          columns: { id: true },
        });
        return {
          ...{ type, ref, title: "Favorite Tracks" },
          subtitle: getTrackCountStr(tracks.length),
          imgSrc: SpecialPlaylists.favorites,
        };
      }
      case SpecialPlaylists.tracks: {
        const tracks = await db.query.tracks.findMany({
          columns: { id: true },
        });
        return {
          ...{ type: "track", ref: null, title: "Tracks", imgSrc: null },
          subtitle: getTrackCountStr(tracks.length),
        };
      }
      default: {
        throw new Error("Playlist feature not implemented.");
      }
    }
  }
}
