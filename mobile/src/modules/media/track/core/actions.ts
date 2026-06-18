import { toast } from "@missingcore/ui/toast";

import { db } from "~/db";
import { hiddenTracks } from "~/db/schema";

import { updatePlaylist } from "~/data/playlist/api";
import { deleteTracks } from "~/data/track/api";
import { Queue } from "~/stores/Playback/actions";
import { trackMultiSelectStore } from "./store";

import { clearAllQueries } from "~/lib/react-query";
import { FavoritesPlaylistKey } from "../../constants";

export function enableTrackMultiSelect() {
  trackMultiSelectStore.setState({ enabled: true, isAllFavorited: false });
}

export function resetTrackMultiSelect() {
  trackMultiSelectStore.setState({
    enabled: false,
    isAllFavorited: false,
    selected: new Set(),
  });
}

export function toggleTrackSelection(id: string) {
  trackMultiSelectStore.setState((prev) => {
    const updatedSet = new Set(prev.selected);
    let updatedIsAllFavorited = prev.isAllFavorited;
    if (updatedSet.has(id)) updatedSet.delete(id);
    else {
      updatedSet.add(id);
      updatedIsAllFavorited = false;
    }
    return {
      enabled: updatedSet.size > 0,
      selected: updatedSet,
      isAllFavorited: updatedIsAllFavorited,
    };
  });
}

//#region Supported Multi-Select Actions
export async function favoriteSelectedTracks() {
  const isAllFavorited = trackMultiSelectStore.getState().isAllFavorited;
  try {
    await toggleSelectedTracksToPlaylist(FavoritesPlaylistKey, isAllFavorited);
    clearAllQueries();
    trackMultiSelectStore.setState({ isAllFavorited: !isAllFavorited });
  } catch (err) {
    console.log(err);
    toast.tError("err.flow.generic.title");
  }
}

/** Hide selected tracks and then close the multi-select menu. */
export async function hideSelectedTracks() {
  const selectedIds = trackMultiSelectStore.getState().selected;
  resetTrackMultiSelect();
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

//#region Helpers
export async function toggleSelectedTracksToPlaylist(
  playlistName: string,
  remove = false,
) {
  const selectedIds = trackMultiSelectStore.getState().selected;
  if (selectedIds.size === 0) return;

  const prevPlaylistTrackIds = (
    await db.query.tracksToPlaylists.findMany({
      where: (fields, { eq }) => eq(fields.playlistName, playlistName),
      columns: { trackId: true },
      orderBy: (fields, { asc }) => asc(fields.position),
    })
  ).map((t) => t.trackId);

  // Sets preserves insertion order.
  let newTrackListSet = new Set(prevPlaylistTrackIds);
  if (remove) newTrackListSet = newTrackListSet.difference(selectedIds);
  else newTrackListSet = new Set([...newTrackListSet, ...selectedIds]);

  return updatePlaylist(playlistName, {
    tracks: Array.from(newTrackListSet).map((id) => ({ id })),
  });
}
//#endregion
//#endregion
