import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import {
  PreferenceSetters,
  PreferenceTogglers,
} from "~/stores/Preference/actions";
import { StandardScrollLayout } from "../../layouts/StandardScroll";

import { List, ListItem } from "~/components/Containment/List";
import { NumericSheet } from "~/components/Sheet/Numeric";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { deferInitialRender } from "../../components/DeferredRender";

export default function PlaybackSettings() {
  const { t } = useTranslation();
  const playbackDelay = usePreferenceStore((s) => s.playbackDelay);
  const repeatOnSkip = usePreferenceStore((s) => s.repeatOnSkip);
  const restoreLastPosition = usePreferenceStore((s) => s.restoreLastPosition);
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

//#region Playback Delay Sheet
const PlaybackDelaySheet = deferInitialRender(
  function PlaybackDelaySheet(props: { sheetRef: TrueSheetRef }) {
    const playbackDelay = usePreferenceStore((s) => s.playbackDelay);
    return (
      <NumericSheet
        sheetRef={props.sheetRef}
        titleKey="feat.playbackDelay.title"
        descriptionKey="feat.playbackDelay.description"
        value={playbackDelay}
        setValue={PreferenceSetters.setPlaybackDelay}
      />
    );
  },
);
//#endregion
