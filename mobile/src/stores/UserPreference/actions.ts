import { userPreferenceStore } from "./store";
import { resolveLanguageConfigs } from "./utils";
import { playbackStore } from "../Playback/store";
import { getSourceName } from "../Playback/utils";

import { clearAllQueries } from "~/lib/react-query";

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
