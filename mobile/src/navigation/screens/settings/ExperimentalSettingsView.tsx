import TrackPlayer from "@weights-ai/react-native-track-player";
import { useTranslation } from "react-i18next";

import {
  userPreferenceStore,
  useUserPreferenceStore,
} from "~/stores/UserPreference/store";
import { StandardScrollLayout } from "../../layouts/StandardScroll";

import { getTrackPlayerOptions } from "~/lib/react-native-track-player";
import { List, ListItem } from "~/components/Containment/List";

export default function ExperimentalSettings() {
  const { t } = useTranslation();
  const continuePlaybackOnDismiss = useUserPreferenceStore(
    (s) => s.continuePlaybackOnDismiss,
  );
  const ignoreInterrupt = useUserPreferenceStore((s) => s.ignoreInterrupt);

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
          titleKey="feat.ignoreInterrupt.title"
          description={t("feat.ignoreInterrupt.brief")}
          onPress={toggleIgnoreInterrupt}
          switchState={ignoreInterrupt}
          last
        />
      </List>
    </StandardScrollLayout>
  );
}

const toggleContinuePlaybackOnDismiss = async () => {
  const nextState = !userPreferenceStore.getState().continuePlaybackOnDismiss;
  userPreferenceStore.setState({ continuePlaybackOnDismiss: nextState });
  await TrackPlayer.updateOptions(
    getTrackPlayerOptions({ continuePlaybackOnDismiss: nextState }),
  );
};

const toggleIgnoreInterrupt = () =>
  userPreferenceStore.setState((prev) => ({
    ignoreInterrupt: !prev.ignoreInterrupt,
  }));
