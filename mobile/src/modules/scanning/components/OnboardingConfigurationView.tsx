// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useTranslation } from "react-i18next";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { preferenceStore, usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import {
  MediaStoreScannerSetting,
  OptimizedImageSavingSetting,
  ScanningConfigurations,
} from "~/navigation/screens/settings/ScanningSettingsView";

import { ExtendedTButton } from "~/components/Form/Button";
import { SegmentedList } from "~/components/List/Segmented";
import { AccentText } from "~/components/Typography/AccentText";
import { TEm } from "~/components/Typography/StyledText";
import { Switch } from "~/components/UI/Switch";

/** Have the user configure settings before initiating the first-time scan. */
export function OnboardingConfiguration() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const sheetRefs = ScanningConfigurations.useScanningSheetRefs();

  return (
    <Animated.View entering={FadeIn} className="flex-1">
      <ScanningConfigurations.Sheets {...sheetRefs} />

      <ListLayout
        contentContainerStyle={{
          paddingTop: insets.top + 64,
          paddingBottom: insets.bottom + 16,
        }}
      >
        <AccentText>{t("feat.onboarding.extra.configureSettings")}</AccentText>

        <TEm textKey="feat.scanning.title" className="-mb-4" />
        <ScanningConfigurations.Settings {...sheetRefs} />
        <OptimizedImageSavingSetting />
        <MediaStoreScannerSetting />
        <TEm textKey="feat.appUpdate.title" className="-mb-4" />
        <AppUpdateConfigurations />

        <ExtendedTButton
          textKey="feat.onboarding.extra.startScan"
          onPress={() =>
            preferenceStore.setState({ completedOnboarding: true })
          }
          className="mt-auto rounded-full"
          theme="secondary"
        />
      </ListLayout>
    </Animated.View>
  );
}

function AppUpdateConfigurations() {
  const checkForUpdates = usePreferenceStore((s) => s.checkForUpdates);
  const showRCNotification = usePreferenceStore((s) => s.rcNotification);

  return (
    <SegmentedList>
      <SegmentedList.Item
        labelText="feat.appUpdate.extra.checkUpdates"
        onPress={PreferenceTogglers.toggleKey("checkForUpdates")}
        Trailing={<Switch enabled={checkForUpdates} />}
      />
      <SegmentedList.Item
        labelText="feat.appUpdate.extra.rcNotification"
        onPress={PreferenceTogglers.toggleKey("rcNotification")}
        disabled={!checkForUpdates}
        Trailing={<Switch enabled={showRCNotification} />}
      />
    </SegmentedList>
  );
}
