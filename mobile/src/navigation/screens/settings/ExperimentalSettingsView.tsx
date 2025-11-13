import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";
import { StandardScrollLayout } from "../../layouts/StandardScroll";

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
          titleKey="feat.smoothPlaybackTransition.title"
          description={t("feat.smoothPlaybackTransition.brief")}
          onPress={PreferenceTogglers.toggleSmoothPlaybackTransition}
          switchState={smoothPlaybackTransition}
          last
        />
      </List>

      <ListItem
        titleKey="feat.waveformSlider.title"
        onPress={PreferenceTogglers.toggleWaveformSlider}
        switchState={waveformSlider}
        first
        last
      />
    </StandardScrollLayout>
  );
}
