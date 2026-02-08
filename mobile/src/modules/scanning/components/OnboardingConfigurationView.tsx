import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { ScanningConfigurations } from "~/navigation/screens/settings/ScanningSettingsView";

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
    <>
      <ScanningConfigurations.Sheets {...sheetRefs} />

      <ListLayout contentContainerStyle={{ paddingTop: insets.top + 64 }}>
        <AccentText className="text-4xl">
          {t("feat.onboarding.extra.configureSettings")}
        </AccentText>

        <TEm textKey="feat.scanning.title" className="-mb-4" />
        <ScanningConfigurations.Settings {...sheetRefs} />
        <TEm textKey="feat.appUpdate.title" className="-mb-4" />
        <AppUpdateConfigurations />

        <ExtendedTButton
          textKey="feat.onboarding.extra.startScan"
          onPress={() => console.log("Starting scan...")}
          className="mt-auto rounded-full bg-secondary active:bg-secondaryDim"
          textClassName="text-onSecondary"
        />
      </ListLayout>
    </>
  );
}

function AppUpdateConfigurations() {
  const checkForUpdates = usePreferenceStore((s) => s.checkForUpdates);
  const showRCNotification = usePreferenceStore((s) => s.rcNotification);

  return (
    <SegmentedList>
      <SegmentedList.Item
        labelTextKey="feat.appUpdate.extra.checkUpdates"
        onPress={PreferenceTogglers.toggleCheckForUpdates}
        RightElement={<Switch enabled={checkForUpdates} />}
      />
      <SegmentedList.Item
        labelTextKey="feat.appUpdate.extra.rcNotification"
        onPress={PreferenceTogglers.toggleRCNotification}
        disabled={!checkForUpdates}
        RightElement={<Switch enabled={showRCNotification} />}
      />
    </SegmentedList>
  );
}
