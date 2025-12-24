import { toast } from "@backpackapp-io/react-native-toast";
import { useTranslation } from "react-i18next";

import { db } from "~/db";
import { waveformSamples } from "~/db/schema";

import i18next from "~/modules/i18n";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";
import { sessionStore } from "~/services/SessionStore";
import { StandardScrollLayout } from "../../layouts/StandardScroll";

import { ToastOptions } from "~/lib/toast";
import { SegmentedList } from "~/components/List/Segmented";
import { Switch } from "~/components/UI/Switch";

export default function ExperimentalSettings() {
  const { t } = useTranslation();
  const continuePlaybackOnDismiss = usePreferenceStore(
    (s) => s.continuePlaybackOnDismiss,
  );
  const ignoreInterrupt = usePreferenceStore((s) => s.ignoreInterrupt);
  const smoothPlaybackTransition = usePreferenceStore(
    (s) => s.smoothPlaybackTransition,
  );
  const queueAwareNext = usePreferenceStore((s) => s.queueAwareNext);
  const waveformSlider = usePreferenceStore((s) => s.waveformSlider);

  return (
    <StandardScrollLayout>
      <SegmentedList>
        <SegmentedList.Item
          labelTextKey="feat.continuePlaybackOnDismiss.title"
          supportingText={t("feat.continuePlaybackOnDismiss.description")}
          onPress={PreferenceTogglers.toggleContinuePlaybackOnDismiss}
          RightElement={<Switch enabled={continuePlaybackOnDismiss} />}
        />
        <SegmentedList.Item
          labelTextKey="feat.ignoreInterrupt.title"
          supportingText={t("feat.ignoreInterrupt.brief")}
          onPress={PreferenceTogglers.toggleIgnoreInterrupt}
          RightElement={<Switch enabled={ignoreInterrupt} />}
        />
        <SegmentedList.Item
          labelText="Smooth Playback Transition"
          supportingText="Restores smooth playback transitions seen pre-v2.7.0. This will eventually become stable. You should disable this if you encounter issues."
          onPress={PreferenceTogglers.toggleSmoothPlaybackTransition}
          RightElement={<Switch enabled={smoothPlaybackTransition} />}
        />
      </SegmentedList>

      <SegmentedList.Item
        labelTextKey="feat.queue.extra.queueAwareNext"
        supportingText={t("feat.queue.extra.queueAwareNextBrief")}
        onPress={PreferenceTogglers.toggleQueueAwareNext}
        RightElement={<Switch enabled={queueAwareNext} />}
      />

      <SegmentedList>
        <SegmentedList.Item
          labelTextKey="feat.waveformSlider.title"
          supportingText={t("feat.waveformSlider.brief")}
          onPress={PreferenceTogglers.toggleWaveformSlider}
          RightElement={<Switch enabled={waveformSlider} />}
        />
        <SegmentedList.Item
          labelTextKey="feat.waveformSlider.extra.purgeCache"
          supportingText={t("feat.waveformSlider.extra.purgeCacheBrief")}
          onPress={purgeWaveformCache}
        />
      </SegmentedList>
    </StandardScrollLayout>
  );
}

//#region Helpers
async function purgeWaveformCache() {
  // eslint-disable-next-line drizzle/enforce-delete-with-where
  await db.delete(waveformSamples);
  sessionStore.setState({ activeWaveformContext: null });
  toast(i18next.t("feat.waveformSlider.extra.purgeCacheToast"), ToastOptions);
}
//#endregion
