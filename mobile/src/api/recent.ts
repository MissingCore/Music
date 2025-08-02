import { and, eq, sql } from "drizzle-orm";

import { db } from "~/db";
import type { AlbumWithTracks, PlayedMediaList } from "~/db/schema";
import { playedMediaLists, tracks } from "~/db/schema";
import { formatForMediaCard, formatForTrack } from "~/db/utils";

import i18next from "~/modules/i18n";
import { getAlbum } from "./album";
import { getArtist } from "./artist";
import { getFolderTracks } from "./folder";
import { getPlaylist, getSpecialPlaylist } from "./playlist";

import type { PlayListSource } from "~/modules/media/types";
import type { ReservedPlaylistName } from "~/modules/media/constants";
import { ReservedNames, ReservedPlaylists } from "~/modules/media/constants";
import type { MediaCard } from "~/modules/media/components/MediaCard";

// 7 days in milliseconds.
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

//#region GET Methods
/** Get a list of recently played media lists. */
export async function getRecentlyPlayedMediaLists() {
  const currTime = Date.now();
  const sources = (await db.query.playedMediaLists.findMany({
    where: (fields, { gt }) => gt(fields.lastPlayedAt, currTime - SEVEN_DAYS),
    orderBy: (fields, { desc }) => desc(fields.lastPlayedAt),
  })) as PlayedMediaList[];

  const newRecentList: MediaCard.Content[] = [];
  const errors: PlayListSource[] = [];

  for (const source of sources) {
    const entry = await getRecentListEntry(source);
    if (entry.error) errors.push(source);
    else newRecentList.push(entry.data);
  }

  // Silently remove recently played media lists that no longer exist.
  Promise.allSettled(errors.map((source) => removePlayedMediaList(source)));

  return newRecentList;
}

/** Get a list of recently played tracks. */
export async function getRecentlyPlayedTracks() {
  const currTime = Date.now();
  const recentTracks = await db.query.tracks.findMany({
    where: (fields, { gt }) => gt(fields.lastPlayedAt, currTime - SEVEN_DAYS),
    columns: {
      id: true,
      name: true,
      artistName: true,
      duration: true,
      artwork: true,
    },
    with: {
      album: { columns: { name: true, artistName: true, artwork: true } },
    },
    orderBy: (fields, { desc }) => desc(fields.lastPlayedAt),
  });

  return recentTracks.map((track) => formatForTrack("track", track));
}
//#endregion

//#region PATCH Methods
/** Update information about an already played list. */
export async function updatePlayedMediaList({
  oldSource,
  newSource,
}: Record<"oldSource" | "newSource", PlayListSource>) {
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
/**
 * Insert a new recently played media list, or updating an existing one.
 * Returns the created entry.
 */
export async function addPlayedMediaList(entry: PlayListSource) {
  const lastPlayedAt = Date.now();
  return (
    await db
      .insert(playedMediaLists)
      .values({ ...entry, lastPlayedAt })
      .onConflictDoUpdate({
        target: [playedMediaLists.id, playedMediaLists.type],
        set: { lastPlayedAt },
      })
      .returning()
  )[0];
}

/** Update the track's `lastPlayedAt` & `playCount` values. */
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
/** Delete specified `PlayedMediaList` entry. */
export async function removePlayedMediaList(entry: PlayListSource) {
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
/** Get a `MediaCard.Content` from a source in the recent list. */
async function getRecentListEntry({ id, type }: PlayListSource) {
  try {
    let entry: MediaCard.Content;
    if (type === "album") {
      const data = (await getAlbum(id, {
        columns: ["id", "name", "artistName", "artwork"],
        withTracks: false,
      })) as AlbumWithTracks;
      data.tracks = [];
      entry = formatForMediaCard({ type: "album", data, t: i18next.t });
    } else if (type === "artist") {
      const data = await getArtist(id, {
        columns: ["name", "artwork"],
        trackColumns: ["id"],
        withAlbum: false,
      });
      entry = formatForMediaCard({ type: "artist", data, t: i18next.t });
    } else if (type === "folder") {
      const numTracks = (await getFolderTracks(id)).length;
      if (numTracks === 0) throw new Error("Folder is empty.");
      entry = {
        type: "folder",
        source: null,
        href: `/folder?path=${encodeURIComponent(id)}`,
        title: id.split("/").at(-2) ?? id,
        description: i18next.t("plural.track", { count: numTracks }),
      };
    } else {
      let data = null;
      if (ReservedNames.has(id)) {
        const specialList = await getSpecialPlaylist(
          id as ReservedPlaylistName,
          { trackColumns: ["id"], withAlbum: false },
        );
        data = {
          ...specialList,
          tracks: specialList.tracks.map(() => ({
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
      if (entry && ReservedNames.has(id)) {
        const tKey = id === ReservedPlaylists.tracks ? "t" : "favoriteT";
        entry.title = i18next.t(`term.${tKey}racks`);
      }
    }
    return { data: entry, error: false } as const;
  } catch {
    return { data: undefined, error: true } as const;
  }
}
//#endregion
