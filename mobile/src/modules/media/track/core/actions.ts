import { db } from "~/db";

import { updatePlaylist } from "~/data/playlist/api";
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
  const { selected, isAllFavorited } = trackMultiSelectStore.getState();
  if (selected.size === 0) return;

  const prevFavoritedTracksIds = (
    await db.query.tracksToPlaylists.findMany({
      where: (fields, { eq }) => eq(fields.playlistName, FavoritesPlaylistKey),
      columns: { trackId: true },
      orderBy: (fields, { asc }) => asc(fields.position),
    })
  ).map((t) => t.trackId);

  // Sets preserves insertion order.
  let favTracksSet = new Set(prevFavoritedTracksIds);
  if (!isAllFavorited) favTracksSet = new Set([...favTracksSet, ...selected]);
  else favTracksSet = favTracksSet.difference(selected);

  await updatePlaylist(FavoritesPlaylistKey, {
    tracks: Array.from(favTracksSet).map((id) => ({ id })),
  });

  clearAllQueries();
  trackMultiSelectStore.setState({ isAllFavorited: !isAllFavorited });
}
//#endregion
