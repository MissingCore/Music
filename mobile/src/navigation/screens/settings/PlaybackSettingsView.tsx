import { useTranslation } from "react-i18next";

import {
  userPreferenceStore,
  useUserPreferenceStore,
} from "~/stores/UserPreference/store";
import { StandardScrollLayout } from "../../layouts/StandardScroll";

import { List, ListItem } from "~/components/Containment/List";
import type { TrueSheetRef } from "~/components/Sheet";
import { NumericSheet, useSheetRef } from "~/components/Sheet";
import { deferInitialRender } from "../../components/DeferredRender";

export default function PlaybackSettings() {
  const { t } = useTranslation();
  const playbackDelay = useUserPreferenceStore((s) => s.playbackDelay);
  const repeatOnSkip = useUserPreferenceStore((s) => s.repeatOnSkip);
  const restoreLastPosition = useUserPreferenceStore(
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
    const playbackDelay = useUserPreferenceStore((s) => s.playbackDelay);
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
  userPreferenceStore.setState((prev) => ({
    repeatOnSkip: !prev.repeatOnSkip,
  }));

const toggleRestoreLastPosition = async () =>
  userPreferenceStore.setState((prev) => ({
    restoreLastPosition: !prev.restoreLastPosition,
  }));

const setPlaybackDelay = (newDelay: number) =>
  userPreferenceStore.setState({ playbackDelay: newDelay });
//#endregion
