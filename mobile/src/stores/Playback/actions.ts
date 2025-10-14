import type { RepeatMode } from "./constants";
import { RepeatModes } from "./constants";
import { playbackStore } from "./store";

import { shuffleArray } from "~/utils/object";

/** Switch to the next repeat mode. */
export async function cycleRepeat() {
  const { repeat } = playbackStore.getState();
  let newMode: RepeatMode = RepeatModes.REPEAT;
  if (repeat === RepeatModes.REPEAT) newMode = RepeatModes.REPEAT_ONE;
  else if (repeat === RepeatModes.REPEAT_ONE) newMode = RepeatModes.NO_REPEAT;
  playbackStore.setState({ repeat: newMode });
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

  let updatedQueue: string[] = [];
  if (newShuffleStatus) updatedQueue = shuffleArray(queue);
  else {
    // Re-order tracks to match `orderSnapshot`, and then append the rest
    // at the end.
    const queueCopy = [...queue];
    orderSnapshot.forEach((trackId) => {
      const atIndex = queueCopy.findIndex((id) => trackId === id);
      if (atIndex !== -1) {
        updatedQueue.push(trackId);
        queueCopy.splice(atIndex, 1);
      }
    });
    updatedQueue.concat(queueCopy);
  }

  playbackStore.setState({
    shuffle: newShuffleStatus,
    queue: updatedQueue,
    queuePosition: updatedQueue.findIndex((id) => id === activeId),
  });
}
