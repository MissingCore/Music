import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { List, ListItem } from "~/components/Containment/List";

/** Screen for `/setting/experimental` route. */
export default function ExperimentalFeaturesScreen() {
  const showSleepTimer = useUserPreferencesStore((state) => state.sleepTimer);

  return (
    <StandardScrollLayout>
      <List>
        <ListItem
          titleKey="feat.sleepTimer.title"
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
