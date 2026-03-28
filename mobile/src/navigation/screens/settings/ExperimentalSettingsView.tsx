import { toast } from "@missingcore/toast";
import { useTranslation } from "react-i18next";

import { db } from "~/db";
import { waveformSamples } from "~/db/schema";

import { OpenInNew } from "~/resources/icons/OpenInNew";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";
import { sessionStore } from "~/stores/Session/store";

import { ListLayout } from "~/navigation/layouts/ListLayout";

import { Links, openLink } from "~/lib/web-browser";
import { SegmentedList } from "~/components/List/Segmented";
import { Switch } from "~/components/UI/Switch";

export default function ExperimentalSettings() {
  const { t } = useTranslation();
  const queueAwareNext = usePreferenceStore((s) => s.queueAwareNext);

  return (
    <ListLayout>
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

      <SegmentedList.Item
        labelTextKey="feat.androidAuto.title"
        onPress={() => openLink(Links.AndroidAuto)}
        RightElement={<OpenInNew />}
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
