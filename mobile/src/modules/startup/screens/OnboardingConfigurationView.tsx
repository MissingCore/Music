// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";
import Animated, { FadeIn } from "react-native-reanimated";

import { preferenceStore } from "~/stores/Preference/store";

import { ScrollLayout } from "~/navigation/layouts/ScrollLayout";
import { AppUpdateSettings } from "~/navigation/screens/settings/AboutView";
import {
  MediaStoreScannerSetting,
  OptimizedImageSavingSetting,
  ScanningConfigurations,
} from "~/navigation/screens/settings/ScanningSettingsView";

import { TText } from "~/components/next/base/typography";
import { ActionButton } from "~/components/next/blocks/button-action";
import * as List from "~/components/next/composed/list";

/** Have the user configure settings before initiating the first-time scan. */
export function OnboardingConfiguration() {
  const { t } = useTranslation();
  const sheetRefs = ScanningConfigurations.useScanningSheetRefs();

  return (
    <Animated.View entering={FadeIn} className="flex-1">
      <ScanningConfigurations.Sheets {...sheetRefs} />

      <ScrollLayout
        title="feat.onboarding.extra.configureSettings"
        contentContainerClassName="pb-safe-offset-4"
      >
        <TText textKey="feat.scanning.title" intent="em" className="-mb-4" />
        <ScanningConfigurations.Settings {...sheetRefs} />

        <List.Group>
          <OptimizedImageSavingSetting />
          <List.Divider />
          <MediaStoreScannerSetting />
        </List.Group>

        <List.Group label={t("feat.appUpdate.title")}>
          <AppUpdateSettings />
        </List.Group>

        <ActionButton
          label={t("feat.onboarding.extra.startScan")}
          onPress={() =>
            preferenceStore.setState({ completedOnboarding: true })
          }
          intent="secondary"
          className="mt-auto"
        />
      </ScrollLayout>
    </Animated.View>
  );
}
