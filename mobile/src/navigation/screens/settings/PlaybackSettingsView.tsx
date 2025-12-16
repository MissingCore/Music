import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { StandardScrollLayout } from "~/navigation/layouts/StandardScroll";
import { PlaybackDelaySheet } from "~/navigation/sheets/PlaybackDelaySheet";

import { List, ListItem } from "~/components/Containment/List";
import { useSheetRef } from "~/components/Sheet";

export default function PlaybackSettings() {
  const { t } = useTranslation();
  const playbackDelay = usePreferenceStore((s) => s.playbackDelay);
  const repeatOnSkip = usePreferenceStore((s) => s.repeatOnSkip);
  const restoreLastPosition = usePreferenceStore((s) => s.restoreLastPosition);
  const playbackDelaySheetRef = useSheetRef();

  return (
    <>
      <PlaybackDelaySheet ref={playbackDelaySheetRef} />

      <StandardScrollLayout>
        <ListItem
          titleKey="feat.playbackDelay.title"
          description={t("plural.second", { count: playbackDelay })}
          onPress={() => playbackDelaySheetRef.current?.present()}
          first
          last
        />

        <List>
          <ListItem
            titleKey="feat.repeatOnSkip.title"
            description={t("feat.repeatOnSkip.brief")}
            onPress={PreferenceTogglers.toggleRepeatOnSkip}
            switchState={repeatOnSkip}
            first
          />
          <ListItem
            titleKey="feat.restoreLastPosition.title"
            onPress={PreferenceTogglers.toggleRestoreLastPosition}
            switchState={restoreLastPosition}
            last
          />
        </List>
      </StandardScrollLayout>
    </>
  );
}
