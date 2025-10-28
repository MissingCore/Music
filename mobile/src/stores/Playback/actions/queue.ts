import { toast } from "@backpackapp-io/react-native-toast";
import { createId } from "@paralleldrive/cuid2";
import TrackPlayer from "@weights-ai/react-native-track-player";

import i18next from "~/modules/i18n";

import { playbackStore } from "../store";
import {
  extractTrackId,
  formatTrackforPlayer,
  getTrackIdsList,
  getUpdatedLists,
} from "../utils";

import { ToastOptions } from "~/lib/toast";
import { moveArray } from "~/utils/object";

/** Add a track after the current playing track. */
export function add({ id, name }: { id: string; name: string }) {
  const { queue, queuePosition } = playbackStore.getState();
  toast(i18next.t("feat.modalTrack.extra.queueAdd", { name }), ToastOptions);

  if (queue.length === 0) return;
  playbackStore.setState({
    queue: queue.toSpliced(queuePosition + 1, 0, `${id}__${createId()}`),
  });
}

/** Move a track in the queue. */
export function moveTrack(fromIndex: number, toIndex: number) {
  const { queue, queuePosition } = playbackStore.getState();

  let newQueuePosition = queuePosition;
  if (fromIndex === queuePosition) newQueuePosition = toIndex;
  else if (fromIndex < queuePosition && toIndex >= queuePosition) {
    // If we move a track before the active track to after it.
    newQueuePosition -= 1;
  } else if (fromIndex > queuePosition && toIndex <= queuePosition) {
    // If we move a track after the active track to before it.
    newQueuePosition += 1;
  }

  playbackStore.setState({
    queue: moveArray(queue, { fromIndex, toIndex }),
    queuePosition: newQueuePosition,
  });
}

/** Remove list of track ids in the current queue. */
export function removeIds(ids: string[]) {
  const idSet = new Set(ids.map(extractTrackId));
  const { reset, orderSnapshot, queue, activeTrack, queuePosition } =
    playbackStore.getState();

  // If active track is removed, reset the playback store.
  if (activeTrack && idSet.has(activeTrack.id)) {
    reset();
    return;
  }

  // If we removed a track before the active track, decremenet `queuePosition`.
  let newQueuePosition = queuePosition;

  const updatedSnapshot = orderSnapshot.filter((tId) => !idSet.has(tId));
  const updatedQueue = queue.filter((tKey, index) => {
    const isRemoved = idSet.has(extractTrackId(tKey));
    if (isRemoved && index < queuePosition) newQueuePosition -= 1;
    return !isRemoved;
  });

  if (queue.length === updatedQueue.length) return;
  playbackStore.setState({
    orderSnapshot: updatedSnapshot,
    queue: updatedQueue,
    queuePosition: newQueuePosition,
  });
}

/**
 * Remove multiple keys in the `queue`. Different than `Queue.removeIds()`,
 * which removes tracks with the underlying id.
 *
 * **Note:** This should be used with debouncing.
 */
export function removeKeys(keys: Set<string>) {
  const { reset, queue, activeKey, queuePosition } = playbackStore.getState();

  // If active track is removed, reset the playback store.
  if (activeKey && keys.has(activeKey)) {
    reset();
    return;
  }

  // If we removed a track before the active track, decremenet `queuePosition`.
  let newQueuePosition = queuePosition;

  const updatedQueue = queue.filter((tKey, index) => {
    const isRemoved = keys.has(tKey);
    if (isRemoved && index < queuePosition) newQueuePosition -= 1;
    return !isRemoved;
  });

  if (queue.length === updatedQueue.length) return;
  playbackStore.setState({
    queue: updatedQueue,
    queuePosition: newQueuePosition,
  });
}

/** Have the queue contents match the original list source. */
export async function synchronize() {
  const { getTrack, shuffle, playingFrom, activeTrack } =
    playbackStore.getState();

  if (!playingFrom || !activeTrack) return;
  const updatedQueue = await getTrackIdsList(playingFrom);
  // Don't do anything if the list no longer exists / is empty.
  if (updatedQueue.length === 0) return;
  const updatedListInfo = getUpdatedLists(
    updatedQueue,
    shuffle,
    activeTrack.id,
  );

  // Handle if the active track isn't in the updated list.
  const newTrackId = updatedListInfo.queue[updatedListInfo.queuePosition]!;
  const isDiffTrack = activeTrack.id !== newTrackId;
  let newTrack = activeTrack;
  if (isDiffTrack) newTrack = (await getTrack(newTrackId))!;

  playbackStore.setState({
    ...updatedListInfo,
    activeKey: newTrackId,
    activeTrack: newTrack,
  });

  // Change playing track if the previous active track doesn't exist in the updated list.
  if (isDiffTrack) await TrackPlayer.load(formatTrackforPlayer(newTrack));
}
