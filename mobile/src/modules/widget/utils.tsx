import { requestWidgetUpdate } from "react-native-android-widget";

import { getTrackCover } from "~/db/utils";

import { musicStore } from "~/modules/media/services/Music";
import { getIsPlaying } from "~/modules/media/hooks/useIsPlaying";

import type { WidgetBaseProps, WidgetTrack } from "./types";
import { ResizeableMusicWidget } from "./ResizableMusicWidget";

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

  return { track, isPlaying };
}

export async function revalidateMusicWidget() {
  const musicContextData = await getMusicWidgetData();

  requestWidgetUpdate({
    widgetName: "ResizeableMusic",
    renderWidget: (props) => (
      <ResizeableMusicWidget {...props} {...musicContextData} />
    ),
    widgetNotFound: () => {},
  });
}
