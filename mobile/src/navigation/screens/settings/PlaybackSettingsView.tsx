import { useTranslation } from "react-i18next";

import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { StandardScrollLayout } from "../../layouts/StandardScroll";

import { List, ListItem } from "~/components/Containment/List";

export default function PlaybackSettings() {
  const { t } = useTranslation();
  const ignoreInterrupt = useUserPreferencesStore((s) => s.ignoreInterrupt);
  const repeatOnSkip = useUserPreferencesStore((s) => s.repeatOnSkip);
  const saveLastPosition = useUserPreferencesStore((s) => s.saveLastPosition);

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

const toggleSaveLastPosition = async () =>
  userPreferencesStore.setState((prev) => ({
    saveLastPosition: !prev.saveLastPosition,
  }));
