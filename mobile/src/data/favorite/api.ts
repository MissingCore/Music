// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { count, eq } from "drizzle-orm";

import { db } from "~/db";
import { albums, playlists, tracksToPlaylists } from "~/db/schema";

import { getAlbumsSummary } from "../album/api";
import { getPlaylistsSummary } from "../playlist/api";

import { FavoritesPlaylistKey } from "~/modules/media/constants";

//#region GET Methods
export async function getFavoriteLists() {
  const [favAlbums, favPlaylists] = await Promise.all([
    getAlbumsSummary(false, [eq(albums.isFavorite, true)]),
    getPlaylistsSummary(false, [eq(playlists.isFavorite, true)]),
  ]);
  return { albums: favAlbums, playlists: favPlaylists };
}

export async function getFavoriteTracksCount() {
  const res = await db
    .select({ count: count() })
    .from(tracksToPlaylists)
    .where(eq(tracksToPlaylists.playlistName, FavoritesPlaylistKey));
  return res[0]?.count ?? 0;
}
//#endregion
