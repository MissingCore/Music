import { removePlayedMediaList, updatePlayedMediaList } from "~/api/recent";

import { playbackStore } from "../store";

import type { PlayListSource } from "~/modules/media/types";
import {
  arePlaybackSourceEqual,
  getSourceName,
} from "~/modules/media/helpers/data";
import { revalidateActiveTrack } from "~/modules/media/helpers/revalidate";

/**
 * Resynchronize when we delete a media list.
 * @deprecated
 */
export async function onDelete(removedRef: PlayListSource) {
  const { reset, playingFrom } = playbackStore.getState();
  if (!playingFrom) return;
  // If we're playing a list we've deleted, reset the state.
  if (arePlaybackSourceEqual(playingFrom, removedRef)) await reset();
}

/** Resynchronize on tracks that have been modified. */
export async function onModifiedTracks(trackIds: string[]) {
  const idSet = new Set(trackIds);
  const { activeId } = playbackStore.getState();
  if (!activeId || !idSet.has(activeId)) return;
  await revalidateActiveTrack({ type: "track", id: activeId });
}

/** Resynchronize when we rename a playlist. */
export async function onRename({
  oldSource,
  newSource,
}: {
  oldSource: PlayListSource;
  newSource: PlayListSource;
}) {
  try {
    await updatePlayedMediaList({ oldSource, newSource });
  } catch {
    // This means `newSource` already exists in the Recent List, so
    // just delete `oldSource`.
    await removePlayedMediaList(oldSource);
  }

  const { playingFrom } = playbackStore.getState();
  if (arePlaybackSourceEqual(playingFrom, oldSource)) {
    playbackStore.setState({
      playingFrom: newSource,
      playingFromName: await getSourceName(newSource),
    });
  }
}
