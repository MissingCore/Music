/**
 * Helpers for manipulating the `react-native-track-player` queue.
 */

import TrackPlayer from "react-native-track-player";

import type { TrackWithAlbum } from "@/db/schema";
import { formatTrackforPlayer } from "./data";

/**
 * Replaces all tracks around a specified index in the current RNTP queue.
 * Useful for when you want seamless transitions between different media
 * list with a common track.
 *
 * If the RNTP queue is currently playing, no interruptions should happen
 * when this replacement is occuring.
 */
export async function replaceAroundTrack({
  tracks,
  oldIndex,
  newIndex,
  shouldPlay = false,
}: {
  /** List of tracks in the new media list. */
  tracks: TrackWithAlbum[];
  /** Index of the track in the old media list. */
  oldIndex: number;
  /** Index of the track in the new media list. */
  newIndex: number;
  /** Whether we should play the queue after replacing the tracks. */
  shouldPlay?: boolean;
}) {
  // Remove all tracks before & after the current playing track.
  await TrackPlayer.remove([...Array(oldIndex).keys()]);
  await TrackPlayer.removeUpcomingTracks();
  // Prepend the tracks that come before the current track in the new list.
  await TrackPlayer.add(tracks.slice(0, newIndex).map(formatTrackforPlayer), 0);
  // Append the tracks that come after the current track in the new list.
  await TrackPlayer.add(tracks.slice(newIndex + 1).map(formatTrackforPlayer));
  if (shouldPlay) await TrackPlayer.play();
}

/**
 * Replaces the current RNTP queue with tracks from a different media list.
 */
export async function replaceRNTPQueue({
  tracks,
  startIndex,
  shouldPlay = false,
}: {
  /** List of tracks in the new media list. */
  tracks: TrackWithAlbum[];
  /** Index in this media list that we want to start from. */
  startIndex: number;
  /** Whether we should play the queue after replacing the tracks. */
  shouldPlay?: boolean;
}) {
  await TrackPlayer.reset();
  await TrackPlayer.add(tracks.map(formatTrackforPlayer));
  await TrackPlayer.skip(startIndex);
  if (shouldPlay) await TrackPlayer.play();
}
