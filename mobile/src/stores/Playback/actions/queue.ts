import { toast } from "@backpackapp-io/react-native-toast";

import i18next from "~/modules/i18n";

import { playbackStore } from "../store";

import { ToastOptions } from "~/lib/toast";
import { moveArray } from "~/utils/object";

/** Add a track after the current playing track. */
export function add({ id, name }: { id: string; name: string }) {
  const { queue, queuePosition } = playbackStore.getState();
  toast(i18next.t("feat.modalTrack.extra.queueAdd", { name }), ToastOptions);

  if (queue.length === 0) return;
  playbackStore.setState({
    queue: queue.toSpliced(queuePosition + 1, 0, id),
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

/** Remove track at specified index of current queue. */
export function removeAtIndex(index: number) {
  const { queue, queuePosition } = playbackStore.getState();

  // If we removed a track before the active track, decremenet `queuePosition`.
  let newQueuePosition = queuePosition;
  if (index < queuePosition) newQueuePosition -= 1;

  playbackStore.setState({
    queue: queue.toSpliced(index, 1),
    queuePosition: newQueuePosition,
  });
}

/** Remove list of track ids in the current queue. */
export function removeIds(ids: string[]) {
  const idSet = new Set(ids);
  const { reset, orderSnapshot, queue, activeId, queuePosition } =
    playbackStore.getState();

  // If active track is removed, reset the playback store.
  if (activeId && idSet.has(activeId)) {
    reset();
    return;
  }

  // If we removed a track before the active track, decremenet `queuePosition`.
  let newQueuePosition = queuePosition;

  const updatedSnapshot = orderSnapshot.filter((tId) => !idSet.has(tId));
  const updatedQueue = queue.filter((tId, index) => {
    const isRemoved = idSet.has(tId);
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
