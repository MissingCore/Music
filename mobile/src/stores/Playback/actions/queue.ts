import { toast } from "@backpackapp-io/react-native-toast";
import { createId } from "@paralleldrive/cuid2";
import TrackPlayer from "@weights-ai/react-native-track-player";

import type { TrackWithAlbum } from "~/db/schema";

import i18next from "~/modules/i18n";

import { playbackStore } from "../store";
import {
  extractTrackId,
  formatTrackforPlayer,
  getTrackIdsList,
  getUpdatedLists,
} from "../utils";
import { preferenceStore } from "../../Preference/store";

import { ToastOptions } from "~/lib/toast";
import { moveArray } from "~/utils/object";
import { isString } from "~/utils/validation";

interface QueueInsertionProps {
  id: string | string[];
  name: string;
  afterQueuedNext?: boolean;
}

/** Add track(s) after the current playing track. */
export function add({ id, name }: QueueInsertionProps) {
  const { queuePosition } = playbackStore.getState();
  const { queueAwareNext } = preferenceStore.getState();
  insertIntoQueue({
    id,
    name,
    afterQueuedNext: queueAwareNext,
    after: queuePosition + 1,
  });
}

/** Add track(s) after the end of the queue. */
export function addToEnd({ id, name }: QueueInsertionProps) {
  const { queue } = playbackStore.getState();
  insertIntoQueue({ id, name, after: queue.length });
}

/** Move a track in the queue. */
export function moveTrack(fromIndex: number, toIndex: number) {
  const { queue, queuePosition, queuedNext } = playbackStore.getState();

  let newQueuePosition = queuePosition;
  if (fromIndex === queuePosition) newQueuePosition = toIndex;
  else if (fromIndex < queuePosition && toIndex >= queuePosition) {
    // If we move a track before the active track to after it.
    newQueuePosition -= 1;
  } else if (fromIndex > queuePosition && toIndex <= queuePosition) {
    // If we move a track after the active track to before it.
    newQueuePosition += 1;
  }

  let newQueuedNext = queuedNext;
  const playNextStart = queuePosition + 1;
  const playNextEnd = queuePosition + queuedNext;
  if (isWithin(playNextStart, fromIndex, playNextEnd)) {
    //? Case if we move a track within the range to outside the range.
    if (!isWithin(playNextStart, toIndex, playNextEnd)) newQueuedNext -= 1;
  } else {
    //? Case if we move a track outside the range to inside the range.
    if (isWithin(playNextStart, toIndex, playNextEnd)) newQueuedNext = 0;
  }

  playbackStore.setState({
    queue: moveArray(queue, { fromIndex, toIndex }),
    queuePosition: newQueuePosition,
    //? Adjust `queuedNext` based on how we moved the track.
    queuedNext: Math.max(0, newQueuedNext),
  });
}

/** Remove list of track ids in the current queue. */
export async function removeIds(ids: string[]) {
  const idSet = new Set(ids.map(extractTrackId));
  const { reset, getTrack, orderSnapshot, queue, activeTrack, queuePosition } =
    playbackStore.getState();

  if (!activeTrack) return;

  // If we removed a track before the active track, decremenet `queuePosition`.
  let newQueuePosition = queuePosition;
  const activeTrackRemoved = idSet.has(activeTrack.id);

  const updatedSnapshot = orderSnapshot.filter((tId) => !idSet.has(tId));
  const updatedQueue = queue.filter((tKey, index) => {
    const isRemoved = idSet.has(extractTrackId(tKey));
    // If the active track is removed (`index === queuePosition`), then
    // `queuePosition` will represent the following track.
    if (isRemoved && index < queuePosition) newQueuePosition -= 1;
    return !isRemoved;
  });

  // If no tracks were removed.
  if (queue.length === updatedQueue.length) return;
  // If all tracks were removed.
  if (updatedQueue.length === 0) return reset();

  let newActiveTrack: TrackWithAlbum | undefined = activeTrack;
  // If the active track was removed.
  if (activeTrackRemoved) {
    const newActiveTrackKey = updatedQueue[newQueuePosition];
    // FIXME: To simplify things, if the next track doesn't exist, but
    // maybe exists before the current position, we reset.
    if (newActiveTrackKey === undefined) return reset();
    newActiveTrack = await getTrack(newActiveTrackKey);
    // If no track was found, then `reset()` was called.
    if (!newActiveTrack) return;

    await TrackPlayer.load(formatTrackforPlayer(newActiveTrack));
  }

  playbackStore.setState({
    orderSnapshot: updatedSnapshot,
    queue: updatedQueue,
    activeKey: updatedQueue[newQueuePosition],
    activeTrack: newActiveTrack,
    queuePosition: newQueuePosition,
    //? Reset `queuedNext` as this function is usually called when we
    //? error or delete a track.
    queuedNext: 0,
  });
}

/**
 * Remove multiple keys in the `queue`. Different than `Queue.removeIds()`,
 * which removes tracks with the underlying id.
 *
 * **Note:** This should be used with debouncing.
 */
export function removeKeys(keys: Set<string>) {
  const { queue, activeKey, queuePosition, queuedNext } =
    playbackStore.getState();

  if (!activeKey) return;
  // You shouldn't be able to remove the active track with this method.
  keys.delete(activeKey);

  // If we removed a track before the active track, decremenet `queuePosition`.
  let newQueuePosition = queuePosition;
  // If we remove a track within `queuedNext` tracks of `queuePosition`, decrement `queuedNext`.
  let newQueuedNext = queuedNext;

  const updatedQueue = queue.filter((tKey, index) => {
    const isRemoved = keys.has(tKey);
    if (isRemoved) {
      if (index < queuePosition) newQueuePosition -= 1;
      // Remember that we'll never encounter `index === queuePosition`.
      else if (index <= queuePosition + queuedNext) newQueuedNext -= 1;
    }
    return !isRemoved;
  });

  if (queue.length === updatedQueue.length) return;
  playbackStore.setState({
    queue: updatedQueue,
    queuePosition: newQueuePosition,
    //? Update `queuedNext` if we manually removed track(s) within `queuedNext`
    //? tracks after `queuePosition`.
    queuedNext: Math.max(0, newQueuedNext),
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

//#region Internal Utils
function isWithin(min: number, value: number, max: number) {
  return value >= min && value <= max;
}

function insertIntoQueue({
  id,
  name,
  afterQueuedNext = false,
  after,
}: QueueInsertionProps & { after: number }) {
  const { queue, queuedNext } = playbackStore.getState();
  toast(i18next.t("feat.queue.extra.toast", { name }), ToastOptions);

  if (queue.length === 0) return;
  const uniqueId = createId();
  playbackStore.setState({
    queue: queue.toSpliced(
      //? Adjust `after` if we're appending the ids after the previously added track.
      afterQueuedNext ? after + queuedNext : after,
      0,
      ...(isString(id) ? [id] : id).map((i) => `${i}__${uniqueId}`),
    ),
    //? Adjust `queuedNext` based on the number of ids inserted.
    queuedNext: !afterQueuedNext
      ? 0
      : queuedNext + (isString(id) ? 1 : id.length),
  });
}
//#endregion
