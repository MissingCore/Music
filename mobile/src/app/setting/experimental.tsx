import { useTranslation } from "react-i18next";

import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { List, ListItem } from "~/components/Containment/List";

/** Screen for `/setting/experimental` route. */
export default function ExperimentalFeaturesScreen() {
  const { t } = useTranslation();
  const showSleepTimer = useUserPreferencesStore((state) => state.sleepTimer);

  return (
    <StandardScrollLayout>
      <List>
        <ListItem
          titleKey="feat.sleepTimer.title"
          description={t("feat.sleepTimer.description")}
          onPress={toggleSleepTimer}
          switchState={showSleepTimer}
          first
          last
        />
      </List>
    </StandardScrollLayout>
  );
}

const toggleSleepTimer = () =>
  userPreferencesStore.setState((prev) => ({ sleepTimer: !prev.sleepTimer }));
