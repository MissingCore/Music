import { toast } from "@missingcore/ui/toast";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { db } from "~/db";
import { waveformSamples } from "~/db/schema";

import { GraphicEQ } from "~/resources/icons/GraphicEQ";
import { OpenInNew } from "~/resources/icons/OpenInNew";
import { Search } from "~/resources/icons/Search";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";
import { sessionStore } from "~/stores/Session/store";

import { ListLayout } from "~/navigation/layouts/ListLayout";

import { Links, openLink } from "~/lib/web-browser";
import { SegmentedList } from "~/components/List/Segmented";
import { ConfirmableAction } from "~/components/Modal";
import { Switch } from "~/components/UI/Switch";

export default function ExperimentalSettings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const queueAwareNext = usePreferenceStore((s) => s.queueAwareNext);
  const downsamplingProcessor = usePreferenceStore(
    (s) => s.downsamplingProcessor,
  );

  return (
    <ListLayout>
      <SegmentedList.Item
        labelTextKey="feat.queue.extra.queueAwareNext"
        supportingText={t("feat.queue.extra.queueAwareNextBrief")}
        onPress={PreferenceTogglers.toggleQueueAwareNext}
        RightElement={<Switch enabled={queueAwareNext} />}
      />

      <SegmentedList.Item
        labelText="Downsample High Sample Rate Audio (192kHz+)"
        supportingText="Downsamples high sample rate audio files to 192kHz so that they can be played instead of throwing an error. This will eventually be the default behavior. Disable this feature if you encounter issues."
        onPress={PreferenceTogglers.toggleDownsamplingProcessor}
        RightElement={<Switch enabled={downsamplingProcessor} />}
      />

      <ConfirmableAction
        Component={SegmentedList.Item}
        componentProps={{
          labelTextKey: "feat.waveformSlider.extra.purgeCache",
          supportingText: t("feat.waveformSlider.extra.purgeCacheBrief"),
          onPress: purgeWaveformCache,
        }}
        modalMessage={["feat.waveformSlider.extra.purgeCache"]}
      />

      <SegmentedList.Item
        labelText="Android Auto"
        onPress={() => openLink(Links.AndroidAuto)}
        RightElement={<OpenInNew />}
      />
      <SegmentedList.Item
        labelTextKey="feat.audioEffects.title"
        onPress={() => navigation.navigate("AudioEffects")}
        LeftElement={<GraphicEQ />}
        className="gap-4"
      />

      <SegmentedList.Item
        labelTextKey="feat.lyrics.extra.providers"
        onPress={() => navigation.navigate("LyricsProviders")}
        LeftElement={<Search />}
        className="gap-4"
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
