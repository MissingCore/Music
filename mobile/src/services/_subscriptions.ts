import { I18nManager } from "react-native";

import i18next from "~/modules/i18n";
import { playbackStore } from "~/stores/Playback/store";
import { userPreferencesStore } from "./UserPreferences";

import { clearAllQueries } from "~/lib/react-query";
import { getSourceName } from "~/stores/Playback/utils";

//#region User Preference Store
/** Set the app's language from what's stored in AsyncStorage. */
userPreferencesStore.subscribe(
  (state) => state.language,
  async (languageCode) => {
    // Set the language used by the app.
    await i18next.changeLanguage(languageCode);
    if (!userPreferencesStore.getState().ignoreRTLLayout) {
      I18nManager.allowRTL(i18next.dir() === "rtl");
      I18nManager.forceRTL(i18next.dir() === "rtl");
    }
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
