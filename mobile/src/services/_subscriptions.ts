import { playbackStore } from "~/stores/Playback/store";
import { userPreferencesStore } from "./UserPreferences";

import { clearAllQueries } from "~/lib/react-query";
import { getSourceName } from "~/stores/Playback/utils";
import { resolveLanguageConfigs } from "~/stores/UserPreference/utils";

//#region User Preference Store
/** Set the app's language from what's stored in AsyncStorage. */
userPreferencesStore.subscribe(
  (state) => state.language,
  async (languageCode) => {
    await resolveLanguageConfigs(
      languageCode,
      userPreferencesStore.getState().ignoreRTLLayout,
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
  },
);
//#endregion
