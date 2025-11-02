import { preferenceStore } from "../store";
import type {
  AccentFont,
  NowPlayingDesign,
  PrimaryFont,
  Theme,
} from "../constants";
import { resolveLanguageConfigs } from "../utils";
import { playbackStore } from "../../Playback/store";
import { getSourceName } from "../../Playback/utils";

import { clearAllQueries } from "~/lib/react-query";

export function setAccentFont(accentFont: AccentFont) {
  preferenceStore.setState({ accentFont });
}

export async function setLanguage(languageCode: string) {
  preferenceStore.setState({ language: languageCode });

  await resolveLanguageConfigs(
    languageCode,
    preferenceStore.getState().ignoreRTLLayout,
  );
  // Make sure our queries that use translated values are updated.
  clearAllQueries();
  // Make sure to refresh the playing source name if it's one of the favorite playlists.
  const { playingFrom } = playbackStore.getState();
  if (playingFrom) {
    playbackStore.setState({
      playingFromName: await getSourceName(playingFrom),
    });
  }
}

export function setMinAlbumLength(minAlbumLength: number) {
  preferenceStore.setState({ minAlbumLength });
}

export function setMinSeconds(minSeconds: number) {
  preferenceStore.setState({ minSeconds });
}

export function setNowPlayingDesign(nowPlayingDesign: NowPlayingDesign) {
  preferenceStore.setState({ nowPlayingDesign });
}

export function setPlaybackDelay(playbackDelay: number) {
  preferenceStore.setState({ playbackDelay });
}

export function setPrimaryFont(primaryFont: PrimaryFont) {
  preferenceStore.setState({ primaryFont });
}

export function setTheme(theme: Theme) {
  preferenceStore.setState({ theme });
}
