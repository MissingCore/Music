import { getTrackCover } from "~/db/utils";

import { sessionStore } from "~/services/SessionStore";
import { musicStore } from "~/modules/media/services/Music";
import { getIsPlaying } from "~/modules/media/hooks/useIsPlaying";

import { updateArtworkPlayerWidget } from "./update";
import type { WidgetBaseProps, WidgetTrack } from "../types";

export async function getArtworkPlayerWidgetData(): Promise<WidgetBaseProps> {
  const { activeTrack } = musicStore.getState();
  let track: WidgetTrack | undefined = undefined;
  if (activeTrack) {
    track = {
      title: activeTrack.name,
      artist: activeTrack.artistName,
      artwork: getTrackCover(activeTrack),
    };
  }
  const isPlaying = await getIsPlaying();
  const widgetData = { track, isPlaying };
  sessionStore.setState({ latestWidgetData: widgetData });

  return widgetData;
}

export async function revalidateArtworkPlayerWidget(options?: {
  /** Switch the widget's click event to open the app. */
  openApp?: boolean;
  /** Don't read the data from the cache. */
  fetchLatest?: boolean;
}) {
  let musicContextData = sessionStore.getState().latestWidgetData;
  if (!options?.openApp || options.fetchLatest) {
    musicContextData = await getArtworkPlayerWidgetData();
  }

  await updateArtworkPlayerWidget({
    ...musicContextData,
    openApp: options?.openApp,
  });
}
