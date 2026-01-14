import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { StandardScrollLayout } from "~/navigation/layouts/StandardScroll";
import { PlaybackDelaySheet } from "~/navigation/sheets/PlaybackDelaySheet";

import { SegmentedList } from "~/components/List/Segmented";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { Switch } from "~/components/UI/Switch";

export default function PlaybackSettings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const playbackDelay = usePreferenceStore((s) => s.playbackDelay);
  const repeatOnSkip = usePreferenceStore((s) => s.repeatOnSkip);
  const restoreLastPosition = usePreferenceStore((s) => s.restoreLastPosition);
  const playbackDelaySheetRef = useSheetRef();

  return (
    <>
      <PlaybackDelaySheet ref={playbackDelaySheetRef} />

      <StandardScrollLayout>
        <SegmentedList.Item
          labelTextKey="feat.playback.extra.delay"
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

        <SegmentedList.Item
          labelTextKey="feat.lyrics.title"
          supportingText={t("feat.lyrics.brief")}
          onPress={() => navigation.navigate("Lyrics")}
        />
      </StandardScrollLayout>
    </>
  );
}
