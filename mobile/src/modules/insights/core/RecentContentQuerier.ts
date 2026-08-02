// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useQuery } from "@tanstack/react-query";
import { desc, eq, gt, max } from "drizzle-orm";

import { db } from "~/db";
import type { PlayedMediaList } from "~/db/schema";
import { playedMediaLists, tracks, tracksPlayEvents } from "~/db/schema";

import i18next from "~/modules/i18n";
import type { PlayFromSource } from "~/stores/Playback/types";
import { getAlbumDetails } from "~/data/album/api";
import { AlbumArtistsKey } from "~/data/album/utils";
import { getArtist } from "~/data/artist/api";
import { getArtistsString } from "~/data/artist/utils";
import { getSortedFolderTracks } from "~/data/folder/api";
import { getGenre } from "~/data/genre/api";
import { getPlaylist } from "~/data/playlist/api";
import { fromJSONArrayString } from "~/data/utils";
import { commonTrackColumns, structuredTracksView } from "~/data/views";

import { ReservedPlaylists } from "~/modules/media/constants";
import type { MediaCardContent } from "~/modules/media/components/MediaCard.type";
import { RECENT_RANGE_MS } from "./constants";
import { PlayedListsTracker } from "./PlayedListsTracker";

const queryKey = ["insights", "recent", "all"];

export function useRecentlyPlayedMedia() {
  return useQuery({
    queryKey,
    queryFn: getRecentMedia,
    gcTime: 0,
    staleTime: 0,
  });
}

//#region Internal Utils
/** Get all recently played content (lists & tracks). */
async function getRecentMedia() {
  const [recentLists, recentTracks] = await Promise.all([
    getRecentLists(),
    getRecentTracks(),
  ]);

  return { lists: recentLists, tracks: recentTracks };
}

async function getRecentLists() {
  const sources = (await db.query.playedMediaLists.findMany({
    orderBy: desc(playedMediaLists.lastPlayedAt),
  })) as PlayedMediaList[];

  const newRecentList: MediaCardContent[] = [];
  const errors: PlayFromSource[] = [];

  const results = await Promise.all(sources.map(getRecentListEntry));
  results.forEach((result) => {
    if (result.error) errors.push(result.source);
    else newRecentList.push(result.data);
  });

  // Silently remove recently played media lists that no longer exist.
  Promise.allSettled(errors.map(PlayedListsTracker.remove));

  return newRecentList;
}

async function getRecentTracks() {
  const results = await db
    .select({
      ...commonTrackColumns,
      //? Ensures only the latest entry is returned.
      //?   - https://stackoverflow.com/a/71924314
      playedAt: max(tracksPlayEvents.playedAt),
    })
    .from(tracksPlayEvents)
    .innerJoin(
      structuredTracksView,
      eq(tracksPlayEvents.trackId, structuredTracksView.id),
    )
    .where(gt(tracksPlayEvents.playedAt, Date.now() - RECENT_RANGE_MS))
    //? To prevent duplicate tracks from being returned.
    .groupBy(tracksPlayEvents.trackId)
    .orderBy(desc(tracksPlayEvents.playedAt));

  return results.map((track) => ({
    id: track.id,
    title: track.name,
    description: getArtistsString(fromJSONArrayString(track.artists)),
    imageSource: track.artwork,
  }));
}

/** Get a `MediaCardContent` from a source in the recent list. */
async function getRecentListEntry(source: PlayFromSource) {
  try {
    const entry: MediaCardContent = {
      ...source,
      source: null,
      title: "",
      description: "",
    };
    if (source.type === "album") {
      const data = await getAlbumDetails(source.id);
      entry.source = data.artwork;
      entry.title = data.name;
      entry.description = AlbumArtistsKey.toString(data.artistsKey);
    } else if (source.type === "artist") {
      const data = await getArtist(source.id, true);
      entry.source = data.artwork;
      entry.title = data.name;
      entry.description = i18next.t("plural.track", {
        count: data.tracks.length,
      });
    } else if (source.type === "folder") {
      const numTracks = (await getSortedFolderTracks(source.id, true)).length;
      if (numTracks === 0) throw new Error("Folder is empty.");
      entry.title = source.id.split("/").at(-2) ?? source.id;
      entry.description = i18next.t("plural.track", { count: numTracks });
    } else if (source.type === "genre") {
      const data = await getGenre(source.id, true);
      entry.source = data.artwork;
      entry.title = data.name;
      entry.description = i18next.t("plural.track", {
        count: data.tracks.length,
      });
    } else {
      if (source.id === ReservedPlaylists.tracks) {
        const numTracks = await db.$count(tracks);
        entry.title = i18next.t("term.tracks");
        entry.source = null;
        entry.description = i18next.t("plural.track", { count: numTracks });
      } else {
        const data = await getPlaylist(source.id, true);
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
