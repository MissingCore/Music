import TrackPlayer from "@weights-ai/react-native-track-player";

import { removePlayedMediaList, updatePlayedMediaList } from "~/api/recent";
import { getTrack } from "~/api/track";

import { playbackStore } from "../store";
import type { PlayFromSource } from "../types";
import {
  arePlaybackSourceEqual,
  formatTrackforPlayer,
  getSourceName,
} from "../utils";

/** See if we should revalidate the `activeTrack` value stored in the Playback store. */
export async function onActiveTrack(args: {
  type: "album" | "track";
  /** If `type = "track"`, `id` should be the actual track id and not `${track_id}__${unique_id}`. */
  id: string;
}) {
  const { activeTrack } = playbackStore.getState();
  if (!activeTrack) return;
  if (args.type === "album" && activeTrack.album?.id !== args.id) return;
  if (args.type === "track" && activeTrack.id !== args.id) return;

  try {
    const updatedTrackData = await getTrack(activeTrack.id);
    playbackStore.setState({ activeTrack: updatedTrackData });

    // Update media notification with updated metadata.
    const rntpTrack = await TrackPlayer.getActiveTrack();
    if (!rntpTrack) return;
    await TrackPlayer.updateMetadataForTrack(
      0,
      formatTrackforPlayer(updatedTrackData),
    );
  } catch {}
}

/** Resynchronize on tracks that have been modified. */
export async function onModifiedTracks(trackIds: string[]) {
  const idSet = new Set(trackIds);
  const { activeTrack } = playbackStore.getState();
  if (!activeTrack || !idSet.has(activeTrack.id)) return;
  await onActiveTrack({ type: "track", id: activeTrack.id });
}

/** Resynchronize when we rename a playlist. */
export async function onRename({
  oldSource,
  newSource,
}: {
  oldSource: PlayFromSource;
  newSource: PlayFromSource;
}) {
  try {
    await updatePlayedMediaList({ oldSource, newSource });
  } catch {
    // This means `newSource` already exists in the Recent List, so
    // just delete `oldSource`.
    await removePlayedMediaList(oldSource);
  }

  const { playingFrom } = playbackStore.getState();
  // Update `playingFrom` if we renamed that source.
  if (arePlaybackSourceEqual(playingFrom, oldSource)) {
    playbackStore.setState({
      playingFrom: newSource,
      playingFromName: await getSourceName(newSource),
    });
  }
}
