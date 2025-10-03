import { getTrackCover } from "~/db/utils";

import { musicStore } from "~/modules/media/services/Music";

import { updateWidgets } from "./update";
import type { PlayerWidgetData } from "../types";

export function getWidgetData(): PlayerWidgetData {
  try {
    const { activeTrack, isPlaying } = musicStore.getState();
    let track: PlayerWidgetData["track"] = undefined;
    if (activeTrack) {
      track = {
        title: activeTrack.name,
        artist: activeTrack.artistName,
        artwork: getTrackCover(activeTrack),
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
}) {
  const musicContextData = getWidgetData();
  if (options?.openApp) musicContextData.isPlaying = false;

  await updateWidgets({
    ...musicContextData,
    openApp: options?.openApp,
  });
}
