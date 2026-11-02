// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { ScrollLayout } from "~/navigation/layouts/ScrollLayout";

import * as List from "~/components/next/composed/list";

export default function PlaybackSettings() {
  const { t } = useTranslation();
  const continuePlaybackOnDismiss = usePreferenceStore(
    (s) => s.continuePlaybackOnDismiss,
  );
  const repeatOnSkip = usePreferenceStore((s) => s.repeatOnSkip);
  const reshuffleOnLaunch = usePreferenceStore((s) => s.reshuffleOnLaunch);
  const restoreLastPosition = usePreferenceStore((s) => s.restoreLastPosition);

  return (
    <ScrollLayout title="feat.playback.title">
      <List.Group>
        <List.ToggleItem
          icon="autoplay"
          label={t("feat.continuePlaybackOnDismiss.title")}
          supporting={t("feat.continuePlaybackOnDismiss.description")}
          onToggle={PreferenceTogglers.toggleContinuePlaybackOnDismiss}
          enabled={continuePlaybackOnDismiss}
        />
        <List.Divider />
        <List.ToggleItem
          icon="history"
          label={t("feat.restoreLastPosition.title")}
          onToggle={PreferenceTogglers.toggleKey("restoreLastPosition")}
          enabled={restoreLastPosition}
        />
      </List.Group>

      <List.Group>
        <List.ToggleItem
          icon="repeat-one"
          label={t("feat.repeatOnSkip.title")}
          supporting={t("feat.repeatOnSkip.brief")}
          onToggle={PreferenceTogglers.toggleKey("repeatOnSkip")}
          enabled={repeatOnSkip}
        />
        <List.Divider />
        <List.ToggleItem
          icon="shuffle"
          label={t("feat.reshuffleOnLaunch.title")}
          supporting={t("feat.reshuffleOnLaunch.brief")}
          onToggle={PreferenceTogglers.toggleKey("reshuffleOnLaunch")}
          enabled={reshuffleOnLaunch}
        />
      </List.Group>
    </ScrollLayout>
  );
}
