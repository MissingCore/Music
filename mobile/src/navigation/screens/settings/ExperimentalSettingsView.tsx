import { useTranslation } from "react-i18next";

import { db } from "~/db";
import { waveformSamples } from "~/db/schema";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";
import { sessionStore } from "~/stores/Session/store";

import { ListLayout } from "~/navigation/layouts/ListLayout";

import { SegmentedList } from "~/components/List/Segmented";
import { toast } from "~/components/Toast";
import { Switch } from "~/components/UI/Switch";

export default function ExperimentalSettings() {
  const { t } = useTranslation();
  const smoothPlaybackTransition = usePreferenceStore(
    (s) => s.smoothPlaybackTransition,
  );
  const queueAwareNext = usePreferenceStore((s) => s.queueAwareNext);

  return (
    <ListLayout>
      <SegmentedList.Item
        labelText="Smooth Playback Transition"
        supportingText="Restores smooth playback transitions seen pre-v2.7.0. This will eventually become stable. You should disable this if you encounter issues."
        onPress={PreferenceTogglers.toggleSmoothPlaybackTransition}
        RightElement={<Switch enabled={smoothPlaybackTransition} />}
      />

      <SegmentedList.Item
        labelTextKey="feat.queue.extra.queueAwareNext"
        supportingText={t("feat.queue.extra.queueAwareNextBrief")}
        onPress={PreferenceTogglers.toggleQueueAwareNext}
        RightElement={<Switch enabled={queueAwareNext} />}
      />

      <SegmentedList.Item
        labelTextKey="feat.waveformSlider.extra.purgeCache"
        supportingText={t("feat.waveformSlider.extra.purgeCacheBrief")}
        onPress={purgeWaveformCache}
      />
    </ListLayout>
  );
}

//#region Helpers
async function purgeWaveformCache() {
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  await db.delete(waveformSamples);
  sessionStore.setState({ activeWaveformContext: null });
  toast.t("feat.waveformSlider.extra.purgeCacheToast");
}
//#endregion
