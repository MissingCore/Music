import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import {
  PreferenceSetters,
  PreferenceTogglers,
} from "~/stores/Preference/actions";
import { StandardScrollLayout } from "../../layouts/StandardScroll";

import { SegmentedList } from "~/components/List/Segmented";
import { NumericSheet } from "~/components/Sheet/Numeric";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { Switch } from "~/components/UI/Switch";
import { deferInitialRender } from "../../components/DeferredRender";

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
        <SegmentedList.Item
          labelTextKey="feat.playbackDelay.title"
          supportingText={t("plural.second", { count: playbackDelay })}
          onPress={() => playbackDelaySheetRef.current?.present()}
        />

        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.repeatOnSkip.title"
            supportingText={t("feat.repeatOnSkip.brief")}
            onPress={PreferenceTogglers.toggleRepeatOnSkip}
            RightElement={<Switch enabled={repeatOnSkip} />}
          />
          <SegmentedList.Item
            labelTextKey="feat.restoreLastPosition.title"
            onPress={PreferenceTogglers.toggleRestoreLastPosition}
            RightElement={<Switch enabled={restoreLastPosition} />}
          />
        </SegmentedList>
      </StandardScrollLayout>
    </>
  );
}

//#region Playback Delay Sheet
const PlaybackDelaySheet = deferInitialRender(
  function PlaybackDelaySheet(props: { ref: TrueSheetRef }) {
    const playbackDelay = usePreferenceStore((s) => s.playbackDelay);
    return (
      <NumericSheet
        ref={props.ref}
        titleKey="feat.playbackDelay.title"
        descriptionKey="feat.playbackDelay.description"
        value={playbackDelay}
        setValue={PreferenceSetters.setPlaybackDelay}
      />
    );
  },
);
//#endregion
