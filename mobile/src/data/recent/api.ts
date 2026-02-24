import { and, eq, gt, sql } from "drizzle-orm";

import { db } from "~/db";
import type { AlbumWithTracks, PlayedMediaList } from "~/db/schema";
import { albums, playedMediaLists, tracks } from "~/db/schema";
import { formatForMediaCard } from "~/db/utils";

import i18next from "~/modules/i18n";
import { getPlaylist } from "~/api/playlist";
import type { PlayFromSource } from "~/stores/Playback/types";
import { getAlbumDetails } from "../album/api";
import { getArtist } from "../artist/api";
import { getFolderTracks } from "../folder/api";
import { getGenre } from "../genre/api";

import { iDesc } from "~/lib/drizzle";
import { ReservedPlaylists } from "~/modules/media/constants";
import type { MediaCardContent } from "~/modules/media/components/MediaCard.type";
import { unencodeJSONArray } from "../utils";
import { getOrderedTrackArtistsView } from "../views";

export const RECENT_DAY_RANGE = 7;
export const RECENT_RANGE_MS = RECENT_DAY_RANGE * 24 * 60 * 60 * 1000;

//#region GET Methods
/** Get all recently played content (lists & tracks). */
export async function getRecentMedia() {
  const [recentLists, recentTracks] = await Promise.all([
    getRecentLists(),
    getRecentTracks(),
  ]);

  return { lists: recentLists, tracks: recentTracks };
}

export async function getRecentLists() {
  const sources = (await db.query.playedMediaLists.findMany({
    orderBy: iDesc(playedMediaLists.lastPlayedAt),
  })) as PlayedMediaList[];

  const newRecentList: MediaCardContent[] = [];
  const errors: PlayFromSource[] = [];

  const results = await Promise.all(sources.map(getRecentListEntry));
  results.forEach((result) => {
    if (result.error) errors.push(result.source);
    else newRecentList.push(result.data);
  });

  // Silently remove recently played media lists that no longer exist.
  Promise.allSettled(errors.map(removePlayedList));

  return newRecentList;
}

export async function getRecentTracks() {
  const orderedTrackArtists = getOrderedTrackArtistsView();

  const results = await db
    .select({
      id: tracks.id,
      name: tracks.name,
      artwork: sql<
        string | null
      >`coalesce(${tracks.artwork}, ${albums.artwork})`.as("derived_artwork"),
      /** We need to unencode these fields. */
      artists: sql<string>`json_group_array(${orderedTrackArtists.artistName})`,
    })
    .from(tracks)
    .where(gt(tracks.lastPlayedAt, Date.now() - RECENT_RANGE_MS))
    .leftJoin(albums, eq(tracks.albumId, albums.id))
    .leftJoin(orderedTrackArtists, eq(tracks.id, orderedTrackArtists.trackId))
    .groupBy(tracks.id)
    .orderBy(iDesc(tracks.lastPlayedAt));

  return results.map((track) => ({
    id: track.id,
    title: track.name,
    description: unencodeJSONArray(track.artists as string)?.join(", ") ?? "—",
    imageSource: track.artwork,
  }));
}
//#endregion

//#region DELETE Methods
export async function removePlayedList(entry: PlayFromSource) {
  return db
    .delete(playedMediaLists)
    .where(
      and(
        eq(playedMediaLists.id, entry.id),
        eq(playedMediaLists.type, entry.type),
      ),
    );
}
//#endregion

//#region Internal Utils
/** Get a `MediaCardContent` from a source in the recent list. */
async function getRecentListEntry(source: PlayFromSource) {
  const { id, type } = source;
  try {
    let entry: MediaCardContent;
    if (type === "album") {
      const data = (await getAlbumDetails(id)) as unknown as AlbumWithTracks;
      data.tracks = [];
      entry = formatForMediaCard({ type: "album", data, t: i18next.t });
    } else if (type === "artist") {
      const { albums: _, ...data } = await getArtist(id, true);
      entry = formatForMediaCard({ type: "artist", data, t: i18next.t });
    } else if (type === "folder") {
      const numTracks = (await getFolderTracks(id, true)).length;
      if (numTracks === 0) throw new Error("Folder is empty.");
      entry = {
        type: "folder",
        source: null,
        id,
        title: id.split("/").at(-2) ?? id,
        description: i18next.t("plural.track", { count: numTracks }),
      };
    } else if (type === "genre") {
      const data = await getGenre(id, true);
      entry = formatForMediaCard({ type: "genre", data, t: i18next.t });
    } else {
      let data = null;
      if (id === ReservedPlaylists.tracks) {
        const numTracks = await db.$count(tracks);
        data = {
          name: id,
          artwork: id,
          tracks: Array.from({ length: numTracks }, () => ({
            artwork: null,
            album: null,
          })),
        };
      } else {
        data = await getPlaylist(id, {
          columns: ["name", "artwork"],
          trackColumns: ["artwork"],
          albumColumns: ["artwork"],
        });
      }
      entry = formatForMediaCard({ type: "playlist", data, t: i18next.t });

      // Translate the names of these special playlists.
      if (entry && id === ReservedPlaylists.tracks) {
        entry.title = i18next.t("term.tracks");
      }
    }
    return { data: entry, source, error: false } as const;
  } catch {
    return { data: undefined, source, error: true } as const;
  }
}
//#endregion
