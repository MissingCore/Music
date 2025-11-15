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
import { List, ListItem } from "~/components/Containment/List";

export default function ExperimentalSettings() {
  const { t } = useTranslation();
  const continuePlaybackOnDismiss = usePreferenceStore(
    (s) => s.continuePlaybackOnDismiss,
  );
  const ignoreInterrupt = usePreferenceStore((s) => s.ignoreInterrupt);
  const smoothPlaybackTransition = usePreferenceStore(
    (s) => s.smoothPlaybackTransition,
  );
  const waveformSlider = usePreferenceStore((s) => s.waveformSlider);

  return (
    <StandardScrollLayout>
      <List>
        <ListItem
          titleKey="feat.continuePlaybackOnDismiss.title"
          description={t("feat.continuePlaybackOnDismiss.description")}
          onPress={PreferenceTogglers.toggleContinuePlaybackOnDismiss}
          switchState={continuePlaybackOnDismiss}
          first
        />
        <ListItem
          titleKey="feat.ignoreInterrupt.title"
          description={t("feat.ignoreInterrupt.brief")}
          onPress={PreferenceTogglers.toggleIgnoreInterrupt}
          switchState={ignoreInterrupt}
        />
        <ListItem
          title="Smooth Playback Transition"
          description="Restores smooth playback transitions seen pre-v2.7.0. This will eventually become stable. You should disable this if you encounter issues."
          onPress={PreferenceTogglers.toggleSmoothPlaybackTransition}
          switchState={smoothPlaybackTransition}
          last
        />
      </List>

      <List>
        <ListItem
          titleKey="feat.waveformSlider.title"
          description={t("feat.waveformSlider.brief")}
          onPress={PreferenceTogglers.toggleWaveformSlider}
          switchState={waveformSlider}
          first
        />
        <ListItem
          titleKey="feat.waveformSlider.extra.purgeCache"
          description={t("feat.waveformSlider.extra.purgeCacheBrief")}
          onPress={purgeWaveformCache}
          last
        />
      </List>
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
