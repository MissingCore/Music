import { useTranslation } from "react-i18next";
import TrackPlayer from "react-native-track-player";

import { musicStore } from "~/modules/media/services/Music";
import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { getTrackPlayerOptions } from "~/lib/react-native-track-player";
import { List, ListItem } from "~/components/Containment/List";

/** Screen for `/setting/playback` route. */
export default function PlaybackScreen() {
  const { t } = useTranslation();
  const ignoreInterrupt = useUserPreferencesStore(
    (state) => state.ignoreInterrupt,
  );
  const repeatOnSkip = useUserPreferencesStore((state) => state.repeatOnSkip);
  const saveLastPosition = useUserPreferencesStore(
    (state) => state.saveLastPosition,
  );

  return (
    <StandardScrollLayout>
      <List>
        <ListItem
          titleKey="feat.ignoreInterrupt.title"
          description={t("feat.ignoreInterrupt.brief")}
          onPress={toggleIgnoreInterrupt}
          switchState={ignoreInterrupt}
          first
        />
        <ListItem
          titleKey="feat.repeatOnSkip.title"
          description={t("feat.repeatOnSkip.brief")}
          onPress={toggleRepeatOnSkip}
          switchState={repeatOnSkip}
          last
        />
      </List>

      <List>
        <ListItem
          titleKey="feat.saveLastPosition.title"
          onPress={toggleSaveLastPosition}
          switchState={saveLastPosition}
          first
          last
        />
      </List>
    </StandardScrollLayout>
  );
}

const toggleIgnoreInterrupt = () =>
  userPreferencesStore.setState((prev) => ({
    ignoreInterrupt: !prev.ignoreInterrupt,
  }));

const toggleRepeatOnSkip = () =>
  userPreferencesStore.setState((prev) => ({
    repeatOnSkip: !prev.repeatOnSkip,
  }));

const toggleSaveLastPosition = async () => {
  const prevState = userPreferencesStore.getState().saveLastPosition;
  if (prevState) musicStore.setState({ lastPosition: null });
  userPreferencesStore.setState({ saveLastPosition: !prevState });

  await TrackPlayer.updateOptions(
    getTrackPlayerOptions({
      progressUpdateEventInterval: prevState ? undefined : 1,
    }),
  );
};
