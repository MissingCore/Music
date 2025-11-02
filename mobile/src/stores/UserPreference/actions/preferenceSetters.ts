import { userPreferenceStore } from "../store";
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
  userPreferenceStore.setState({ accentFont });
}

export async function setLanguage(languageCode: string) {
  userPreferenceStore.setState({ language: languageCode });

  await resolveLanguageConfigs(
    languageCode,
    userPreferenceStore.getState().ignoreRTLLayout,
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
  userPreferenceStore.setState({ minAlbumLength });
}

export function setNowPlayingDesign(nowPlayingDesign: NowPlayingDesign) {
  userPreferenceStore.setState({ nowPlayingDesign });
}

export function setPrimaryFont(primaryFont: PrimaryFont) {
  userPreferenceStore.setState({ primaryFont });
}

export function setTheme(theme: Theme) {
  userPreferenceStore.setState({ theme });
}
