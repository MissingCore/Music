import TrackPlayer, {
  RepeatMode as RNTPRepeatMode,
} from "@weights-ai/react-native-track-player";

import { playbackStore } from "../store";
import type { RepeatMode } from "../constants";
import { RepeatModes } from "../constants";

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
  const { shuffle, orderSnapshot, queue, activeId } = playbackStore.getState();
  const newShuffleStatus = !shuffle;

  // Exit early if we don't have a list loaded.
  if (queue.length === 0 || !activeId) {
    playbackStore.setState({ shuffle: newShuffleStatus });
    return;
  }

  let updatedQueue: string[] = queue;
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
    const canSwitch = queue.every((tId) => {
      if (referenceSet[tId] === undefined) return false;
      referenceSet[tId]--;
      if (referenceSet[tId] === 0) delete referenceSet[tId];
      return true;
    });
    if (canSwitch) updatedQueue = orderSnapshot;
  }

  playbackStore.setState({
    shuffle: newShuffleStatus,
    queue: updatedQueue,
    queuePosition: updatedQueue.findIndex((id) => id === activeId),
  });
}
