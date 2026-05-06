import { Uniwind } from "uniwind";

import { preferenceStore } from "../store";
import type { Font, NowPlayingDesign } from "../constants";
import {
  clampMinAlbumLength,
  clampPlaybackDelay,
  resolveLanguageConfigs,
} from "../utils";
import { playbackStore } from "../../Playback/store";
import { getSourceName } from "../../Playback/utils";

import { clearAllQueries } from "~/lib/react-query";
import type { DefaultTheme } from "~/modules/theme/constants";

export function setAccentFont(accentFont: Font) {
  preferenceStore.setState({ accentFont });
}

export async function setLanguage(languageCode: string) {
  preferenceStore.setState({ language: languageCode });

  await resolveLanguageConfigs(
    languageCode,
    preferenceStore.getState().forceLTR,
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

export function setMinSeconds(minSeconds: number) {
  preferenceStore.setState({ minSeconds });
}

export function setNowPlayingDesign(nowPlayingDesign: NowPlayingDesign) {
  preferenceStore.setState({ nowPlayingDesign });
}

export function setPrimaryFont(primaryFont: Font) {
  preferenceStore.setState({ primaryFont });
}

export function setTheme(theme: DefaultTheme) {
  preferenceStore.setState({ theme, activeCustomThemeId: null });
  Uniwind.setTheme(theme);
}

export function updateMinAlbumLengthByDelta(delta: number) {
  preferenceStore.setState((prev) => ({
    minAlbumLength: clampMinAlbumLength(prev.minAlbumLength + delta),
  }));
}

export function updatePlaybackDelayByDelta(delta: number) {
  preferenceStore.setState((prev) => ({
    playbackDelay: clampPlaybackDelay(prev.playbackDelay + delta),
  }));
}
