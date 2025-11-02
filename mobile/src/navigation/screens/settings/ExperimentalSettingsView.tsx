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
          last
        />
      </List>
    </StandardScrollLayout>
  );
}
