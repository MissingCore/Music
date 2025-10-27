import TrackPlayer, {
  RepeatMode as RNTPRepeatMode,
} from "@weights-ai/react-native-track-player";

import { playbackStore } from "../store";
import type { RepeatMode } from "../constants";
import { RepeatModes } from "../constants";
import { extractTrackId } from "../utils";

import { shuffleArray } from "~/utils/object";

/** Switch to the next repeat mode. */
export async function cycleRepeat() {
  const { repeat } = playbackStore.getState();
  let newMode: RepeatMode = RepeatModes.REPEAT;
  if (repeat === RepeatModes.REPEAT) newMode = RepeatModes.REPEAT_ONE;
  else if (repeat === RepeatModes.REPEAT_ONE) newMode = RepeatModes.NO_REPEAT;
  playbackStore.setState({ repeat: newMode });

  await TrackPlayer.setRepeatMode(
    newMode === RepeatModes.REPEAT_ONE
      ? RNTPRepeatMode.Track
      : RNTPRepeatMode.Off,
  );
}

/** Update the `shuffle` field along with `currentList` & `listIdx`. */
export async function toggleShuffle() {
  const { shuffle, orderSnapshot, queue, activeKey } = playbackStore.getState();
  const newShuffleStatus = !shuffle;

  // Exit early if we don't have a list loaded.
  if (queue.length === 0 || !activeKey) {
    playbackStore.setState({ shuffle: newShuffleStatus });
    return;
  }

  let updatedQueue: string[] = queue;
  let isOrderSnapshot = false;
  if (newShuffleStatus) updatedQueue = shuffleArray(queue);
  else if (orderSnapshot.length === queue.length) {
    // Revert to `orderSnapshot` only if the queue copy has the same contents.
    const referenceSet = orderSnapshot.reduce(
      (map, tId) => {
        if (map[tId]) map[tId]++;
        else map[tId] = 1;
        return map;
      },
      {} as Record<string, number>,
    );
    const canSwitch = queue.every((tKey) => {
      const tId = extractTrackId(tKey);
      if (referenceSet[tId] === undefined) return false;
      referenceSet[tId]--;
      if (referenceSet[tId] === 0) delete referenceSet[tId];
      return true;
    });
    if (canSwitch) {
      isOrderSnapshot = true;
      updatedQueue = orderSnapshot;
    }
  }

  // `activeKey` shouldn't have the unqiue id portion if switching to `orderSnapshot`.
  const trackKey = isOrderSnapshot ? extractTrackId(activeKey) : activeKey;

  playbackStore.setState({
    shuffle: newShuffleStatus,
    queue: updatedQueue,
    activeKey: trackKey,
    queuePosition: updatedQueue.findIndex((id) => id === trackKey),
  });
}
