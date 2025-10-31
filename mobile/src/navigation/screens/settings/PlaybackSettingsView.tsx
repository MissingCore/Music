import { useTranslation } from "react-i18next";

import {
  userPreferencesStore,
  useUserPreferencesStore,
} from "~/services/UserPreferences";
import { StandardScrollLayout } from "../../layouts/StandardScroll";

import { List, ListItem } from "~/components/Containment/List";
import type { TrueSheetRef } from "~/components/Sheet";
import { NumericSheet, useSheetRef } from "~/components/Sheet";
import { deferInitialRender } from "../../components/DeferredRender";

export default function PlaybackSettings() {
  const { t } = useTranslation();
  const playbackDelay = useUserPreferencesStore((s) => s.playbackDelay);
  const repeatOnSkip = useUserPreferencesStore((s) => s.repeatOnSkip);
  const restoreLastPosition = useUserPreferencesStore(
    (s) => s.restoreLastPosition,
  );
  const playbackDelaySheetRef = useSheetRef();

  return (
    <>
      <PlaybackDelaySheet sheetRef={playbackDelaySheetRef} />
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
            onPress={toggleRepeatOnSkip}
            switchState={repeatOnSkip}
            first
          />
          <ListItem
            titleKey="feat.restoreLastPosition.title"
            onPress={toggleRestoreLastPosition}
            switchState={restoreLastPosition}
            last
          />
        </List>
      </StandardScrollLayout>
    </>
  );
}

//#region Playback Delay Sheet
const PlaybackDelaySheet = deferInitialRender(
  function PlaybackDelaySheet(props: { sheetRef: TrueSheetRef }) {
    const playbackDelay = useUserPreferencesStore(
      (state) => state.playbackDelay,
    );
    return (
      <NumericSheet
        sheetRef={props.sheetRef}
        titleKey="feat.playbackDelay.title"
        descriptionKey="feat.playbackDelay.description"
        value={playbackDelay}
        setValue={setPlaybackDelay}
      />
    );
  },
);
//#endregion

//#region Helpers
const toggleRepeatOnSkip = () =>
  userPreferencesStore.setState((prev) => ({
    repeatOnSkip: !prev.repeatOnSkip,
  }));

const toggleRestoreLastPosition = async () =>
  userPreferencesStore.setState((prev) => ({
    restoreLastPosition: !prev.restoreLastPosition,
  }));

const setPlaybackDelay = (newDelay: number) =>
  userPreferencesStore.setState({ playbackDelay: newDelay });
//#endregion
