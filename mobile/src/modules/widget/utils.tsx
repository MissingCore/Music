import { requestWidgetUpdate } from "react-native-android-widget";

import { getTrackCover } from "~/db/utils";

import { sessionStore } from "~/services/SessionStore";
import { musicStore } from "~/modules/media/services/Music";
import { getIsPlaying } from "~/modules/media/hooks/useIsPlaying";

import type { WidgetBaseProps, WidgetTrack } from "./types";
import { MusicPlayerWidget } from "./MusicPlayerWidget";

export async function getMusicWidgetData(): Promise<WidgetBaseProps> {
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

export async function revalidateMusicWidget(options?: { openApp?: boolean }) {
  const musicContextData = options?.openApp
    ? sessionStore.getState().latestWidgetData
    : await getMusicWidgetData();

  requestWidgetUpdate({
    widgetName: "MusicPlayer",
    renderWidget: (props) => (
      <MusicPlayerWidget
        {...props}
        {...musicContextData}
        openApp={options?.openApp}
      />
    ),
    widgetNotFound: () => {},
  });
}
