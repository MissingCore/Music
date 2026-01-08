import { getArtistsString } from "~/api/artist.utils";
import { getTrackArtwork } from "~/api/track.utils";
import { playbackStore } from "~/stores/Playback/store";

import { updateWidgets } from "./update";
import type { WidgetName } from "../constants/Widgets";
import type { PlayerWidgetData } from "../types";

export function getWidgetData(): PlayerWidgetData {
  try {
    const { activeTrack, isPlaying } = playbackStore.getState();
    let track: PlayerWidgetData["track"] = undefined;
    if (activeTrack) {
      track = {
        title: activeTrack.name,
        artist: getArtistsString(activeTrack.tracksToArtists, false),
        artwork: getTrackArtwork(activeTrack),
      };
    }
    return { track, isPlaying };
  } catch {
    // We'll end up here if the RNTP service isn't set up yet.
    return { track: undefined, isPlaying: false };
  }
}

export async function revalidateWidgets(options?: {
  /** Switch the widget's click event to open the app. */
  openApp?: boolean;
  exclude?: WidgetName[];
}) {
  const musicContextData = getWidgetData();
  if (options?.openApp) musicContextData.isPlaying = false;

  await updateWidgets({ ...musicContextData, ...(options ?? {}) });
}
