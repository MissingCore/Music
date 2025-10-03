import { getTrackCover } from "~/db/utils";

import { sessionStore } from "~/services/SessionStore";
import { musicStore } from "~/modules/media/services/Music";

import { updateWidgets } from "./update";
import type { PlayerWidgetData } from "../types";

export async function getWidgetData(): Promise<PlayerWidgetData> {
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

    const widgetData = { track, isPlaying };
    sessionStore.setState({ latestWidgetData: widgetData });

    return widgetData;
  } catch {
    // We'll end up here if the RNTP service isn't set up yet.
    return { track: undefined, isPlaying: false };
  }
}

export async function revalidateWidgets(options?: {
  /** Switch the widget's click event to open the app. */
  openApp?: boolean;
  /** Don't read the data from the cache. */
  fetchLatest?: boolean;
}) {
  let musicContextData = sessionStore.getState().latestWidgetData;
  if (!options?.openApp || options.fetchLatest) {
    musicContextData = await getWidgetData();
  }

  await updateWidgets({
    ...musicContextData,
    openApp: options?.openApp,
  });
}
