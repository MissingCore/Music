import { useTranslation } from "react-i18next";
import TrackPlayer from "@weights-ai/react-native-track-player";

import { musicStore } from "~/modules/media/services/Music";
import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { getTrackPlayerOptions } from "~/lib/react-native-track-player";
import { List, ListItem } from "~/components/Containment/List";

export default function PlaybackSettings() {
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
  const didSaveLastPosition = userPreferencesStore.getState().saveLastPosition;
  if (didSaveLastPosition) musicStore.setState({ lastPosition: undefined });
  userPreferencesStore.setState({ saveLastPosition: !didSaveLastPosition });

  await TrackPlayer.updateOptions(
    getTrackPlayerOptions({ saveLastPosition: !didSaveLastPosition }),
  );
};
