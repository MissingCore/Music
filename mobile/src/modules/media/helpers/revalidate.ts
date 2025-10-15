import TrackPlayer from "@weights-ai/react-native-track-player";

import { getTrack } from "~/api/track";
import { playbackStore } from "~/stores/Playback/store";

import { formatTrackforPlayer } from "./data";

/** See if we should revalidate the `activeTrack` value stored in the Music store. */
export async function revalidateActiveTrack(args: {
  type: "album" | "track";
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
    await TrackPlayer.updateMetadataForTrack(0, {
      ...formatTrackforPlayer(updatedTrackData),
      // @ts-expect-error - Should allow for custom properties.
      "music::status": rntpTrack["music::status"],
    });
  } catch {}
}
