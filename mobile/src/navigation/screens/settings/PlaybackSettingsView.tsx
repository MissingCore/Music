import { useTranslation } from "react-i18next";

import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { StandardScrollLayout } from "../../layouts/StandardScroll";

import { List, ListItem } from "~/components/Containment/List";

export default function PlaybackSettings() {
  const { t } = useTranslation();
  const repeatOnSkip = useUserPreferencesStore((s) => s.repeatOnSkip);
  const restoreLastPosition = useUserPreferencesStore(
    (s) => s.restoreLastPosition,
  );

  return (
    <StandardScrollLayout>
      <ListItem
        titleKey="feat.repeatOnSkip.title"
        description={t("feat.repeatOnSkip.brief")}
        onPress={toggleRepeatOnSkip}
        switchState={repeatOnSkip}
        first
        last
      />

      <List>
        <ListItem
          titleKey="feat.restoreLastPosition.title"
          onPress={toggleRestoreLastPosition}
          switchState={restoreLastPosition}
          first
          last
        />
      </List>
    </StandardScrollLayout>
  );
}

const toggleRepeatOnSkip = () =>
  userPreferencesStore.setState((prev) => ({
    repeatOnSkip: !prev.repeatOnSkip,
  }));

const toggleRestoreLastPosition = async () =>
  userPreferencesStore.setState((prev) => ({
    restoreLastPosition: !prev.restoreLastPosition,
  }));
