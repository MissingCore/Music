import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { ListLayout } from "~/navigation/layouts/ListLayout";

import { SegmentedList } from "~/components/List/Segmented";
import { Switch } from "~/components/UI/Switch";

export default function PlaybackSettings() {
  const { t } = useTranslation();
  const continuePlaybackOnDismiss = usePreferenceStore(
    (s) => s.continuePlaybackOnDismiss,
  );
  const repeatOnSkip = usePreferenceStore((s) => s.repeatOnSkip);
  const restoreLastPosition = usePreferenceStore((s) => s.restoreLastPosition);

  return (
    <ListLayout>
      <SegmentedList>
        <SegmentedList.Item
          labelTextKey="feat.continuePlaybackOnDismiss.title"
          supportingText={t("feat.continuePlaybackOnDismiss.description")}
          onPress={PreferenceTogglers.toggleContinuePlaybackOnDismiss}
          RightElement={<Switch enabled={continuePlaybackOnDismiss} />}
        />
        <SegmentedList.Item
          labelTextKey="feat.restoreLastPosition.title"
          onPress={PreferenceTogglers.toggleRestoreLastPosition}
          RightElement={<Switch enabled={restoreLastPosition} />}
        />
      </SegmentedList>

      <SegmentedList.Item
        labelTextKey="feat.repeatOnSkip.title"
        supportingText={t("feat.repeatOnSkip.brief")}
        onPress={PreferenceTogglers.toggleRepeatOnSkip}
        RightElement={<Switch enabled={repeatOnSkip} />}
      />
    </ListLayout>
  );
}
