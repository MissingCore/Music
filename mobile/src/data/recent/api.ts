import { and, eq, gt, sql } from "drizzle-orm";

import { db } from "~/db";
import type { PlayedMediaList } from "~/db/schema";
import { albums, playedMediaLists, tracks } from "~/db/schema";
import type { SlimAlbum } from "~/db/slimTypes";
import { formatForMediaCard } from "~/db/utils";

import i18next from "~/modules/i18n";
import type { PlayFromSource } from "~/stores/Playback/types";
import { getAlbumDetails } from "../album/api";
import { getArtist } from "../artist/api";
import { getArtistsString } from "../artist/utils";
import { getFolderTracks } from "../folder/api";
import { getGenre } from "../genre/api";
import { getPlaylist } from "../playlist/api";

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
  Promise.allSettled(errors.map(removePlayedMediaList));

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
    description: getArtistsString(unencodeJSONArray(track.artists as string)),
    imageSource: track.artwork,
  }));
}
//#endregion

//#region PATCH Methods
export async function updatePlayedMediaList({
  oldSource,
  newSource,
}: Record<"oldSource" | "newSource", PlayFromSource>) {
  return db
    .update(playedMediaLists)
    .set(newSource)
    .where(
      and(
        eq(playedMediaLists.id, oldSource.id),
        eq(playedMediaLists.type, oldSource.type),
      ),
    );
}
//#endregion

//#region PUT Methods
export async function addPlayedMediaList(entry: PlayFromSource) {
  const lastPlayedAt = Date.now();
  return db
    .insert(playedMediaLists)
    .values({ ...entry, lastPlayedAt })
    .onConflictDoUpdate({
      target: [playedMediaLists.id, playedMediaLists.type],
      set: { lastPlayedAt },
    });
}

export async function addPlayedTrack(id: string) {
  return db
    .update(tracks)
    .set({
      lastPlayedAt: Date.now(),
      playCount: sql`${tracks.playCount} + 1`,
    })
    .where(eq(tracks.id, id));
}
//#endregion

//#region DELETE Methods
export async function removePlayedMediaList(entry: PlayFromSource) {
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
    let entry = { type, id } as MediaCardContent;
    if (type === "album") {
      const data = (await getAlbumDetails(id)) as unknown as SlimAlbum & {
        tracks: any[];
      };
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
      if (id === ReservedPlaylists.tracks) {
        const numTracks = await db.$count(tracks);
        entry.title = i18next.t("term.tracks");
        entry.source = id;
        entry.description = i18next.t("plural.track", { count: numTracks });
      } else {
        const data = await getPlaylist(id, true);
        entry.title = data.name;
        entry.source = data.artwork;
        entry.description = i18next.t("plural.track", {
          count: data.tracks.length,
        });
      }
    }
    return { data: entry, source, error: false } as const;
  } catch {
    return { data: undefined, source, error: true } as const;
  }
}
//#endregion
