// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { toast } from "@missingcore/ui/toast";

import { db } from "~/db";
import { hiddenTracks } from "~/db/schema";

import { createPlaylist, updatePlaylist } from "~/data/playlist/api";
import { deleteTracks } from "~/data/track/api";
import { Queue } from "~/stores/Playback/actions";
import { TrackMultiSelect, trackMultiSelectStore } from "./store";

import { clearAllQueries } from "~/lib/react-query";
import { FavoritesPlaylistKey } from "../../constants";

/** Create new playlist with selected tracks and then close the multi-select menu. */
export async function addSelectedToCreatedPlaylist(playlistName: string) {
  const selectedIds = trackMultiSelectStore.getState().selected;
  // Dismiss multi-select menu while we create the playlist in the background.
  TrackMultiSelect.reset();
  try {
    await createPlaylist({
      name: playlistName,
      tracks: Array.from(selectedIds).map((id) => ({ id })),
    });
    clearAllQueries();
  } catch (err) {
    console.log(err);
    toast.tError("err.flow.generic.title");
  }
}

/** Add selected tracks to "Favorite Tracks" playlist. Remove them instead of `isAllFavorited = true`. */
export async function favoriteSelected() {
  const isAllFavorited = trackMultiSelectStore.getState().isAllFavorited;
  const config = { playlistName: FavoritesPlaylistKey, remove: isAllFavorited };
  const status = await updateTracksInPlaylist(config);
  if (status === "success") {
    clearAllQueries();
    trackMultiSelectStore.setState({ isAllFavorited: !isAllFavorited });
  } else if (status === "error") {
    toast.tError("err.flow.generic.title");
  }
}

/** Hide selected tracks and then close the multi-select menu. */
export async function hideSelected() {
  const selectedIds = trackMultiSelectStore.getState().selected;
  // Dismiss multi-select menu while we hide the tracks in the background.
  TrackMultiSelect.reset();
  if (selectedIds.size === 0) return;

  const tracksToHide = await db.query.tracks.findMany({
    where: (fields, { inArray }) => inArray(fields.id, Array.from(selectedIds)),
    columns: { id: true, name: true, uri: true },
  });
  if (tracksToHide.length === 0) return;

  try {
    await deleteTracks(tracksToHide.map((t) => ({ id: t.id })));
    await db
      .insert(hiddenTracks)
      .values(tracksToHide.map((t) => ({ ...t, hiddenAt: Date.now() })));

    clearAllQueries();
    await Queue.removeIds(tracksToHide.map((t) => t.id));
  } catch (err) {
    console.log(err);
    toast.tError("err.flow.generic.title");
  }
}

/** Removes selected track from playlist and then close the multi-select menu. */
export async function removeSelectedFromPlaylist(playlistName: string) {
  const trackIds = trackMultiSelectStore.getState().selected;
  // Dismiss multi-select menu while we remove the tracks from the playlist in the background.
  TrackMultiSelect.reset();
  const config = { playlistName, remove: true, trackIds };
  const status = await updateTracksInPlaylist(config);
  if (status === "success") {
    clearAllQueries();
  } else if (status === "error") {
    toast.tError("err.flow.generic.title");
  }
}

/** Add or remove selected tracks in playlist. */
export async function updateTracksInPlaylist(config: {
  playlistName: string;
  remove?: boolean;
  trackIds?: Set<string>;
}): Promise<"success" | "skip" | "error"> {
  const shouldRemove = config.remove ?? false;
  const trackIds = config.trackIds ?? trackMultiSelectStore.getState().selected;
  if (trackIds.size === 0) return "skip";

  try {
    // Get the ids of tracks currently in the playlist so we can merge or remove the specified ids.
    const prevPlaylistTrackIds = (
      await db.query.tracksToPlaylists.findMany({
        where: (fields, { eq }) => eq(fields.playlistName, config.playlistName),
        columns: { trackId: true },
        orderBy: (fields, { asc }) => asc(fields.position),
      })
    ).map((t) => t.trackId);

    // Sets preserves insertion order.
    let newTrackListSet = new Set(prevPlaylistTrackIds);
    if (shouldRemove) newTrackListSet = newTrackListSet.difference(trackIds);
    else newTrackListSet = new Set([...newTrackListSet, ...trackIds]);

    await updatePlaylist(config.playlistName, {
      tracks: Array.from(newTrackListSet).map((id) => ({ id })),
    });
    return "success";
  } catch (err) {
    console.log(err);
    return "error";
  }
}
