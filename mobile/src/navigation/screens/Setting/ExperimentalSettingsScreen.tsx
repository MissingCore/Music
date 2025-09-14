import TrackPlayer from "@weights-ai/react-native-track-player";
import { useTranslation } from "react-i18next";

import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { getTrackPlayerOptions } from "~/lib/react-native-track-player";
import { List, ListItem } from "~/components/Containment/List";

export default function ExperimentalSettingsScreen() {
  const { t } = useTranslation();
  const continuePlaybackOnDismiss = useUserPreferencesStore(
    (state) => state.continuePlaybackOnDismiss,
  );
  const showSleepTimer = useUserPreferencesStore((state) => state.sleepTimer);

  return (
    <StandardScrollLayout>
      <List>
        <ListItem
          titleKey="feat.continuePlaybackOnDismiss.title"
          description={t("feat.continuePlaybackOnDismiss.description")}
          onPress={toggleContinuePlaybackOnDismiss}
          switchState={continuePlaybackOnDismiss}
          first
        />
        <ListItem
          titleKey="feat.sleepTimer.title"
          description={t("feat.sleepTimer.description")}
          onPress={toggleSleepTimer}
          switchState={showSleepTimer}
          last
        />
      </List>
    </StandardScrollLayout>
  );
}

const toggleContinuePlaybackOnDismiss = async () => {
  const nextState = !userPreferencesStore.getState().continuePlaybackOnDismiss;
  userPreferencesStore.setState({ continuePlaybackOnDismiss: nextState });
  await TrackPlayer.updateOptions(
    getTrackPlayerOptions({ continuePlaybackOnDismiss: nextState }),
  );
};

const toggleSleepTimer = () =>
  userPreferencesStore.setState((prev) => ({ sleepTimer: !prev.sleepTimer }));
