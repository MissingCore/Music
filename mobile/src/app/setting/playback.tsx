import { useTranslation } from "react-i18next";

import { useUserPreferencesStore } from "~/services/UserPreferences";
import { StandardScrollLayout } from "~/layouts/StandardScroll";

import { List, ListItem } from "~/components/Containment/List";

/** Screen for `/setting/playback` route. */
export default function PlaybackScreen() {
  const { t } = useTranslation();
  const ignoreInterrupt = useUserPreferencesStore(
    (state) => state.ignoreInterrupt,
  );
  const toggleIgnoreInterrupt = useUserPreferencesStore(
    (state) => state.toggleIgnoreInterrupt,
  );
  const repeatOnSkip = useUserPreferencesStore((state) => state.repeatOnSkip);
  const toggleRepeatOnSkip = useUserPreferencesStore(
    (state) => state.toggleRepeatOnSkip,
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
    </StandardScrollLayout>
  );
}
