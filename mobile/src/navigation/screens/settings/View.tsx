import { useNavigation } from "@react-navigation/native";
import { openBrowserAsync } from "expo-web-browser";
import { useTranslation } from "react-i18next";

import { Archive } from "~/resources/icons/Archive";
import { AutoPlay } from "~/resources/icons/AutoPlay";
import { BarChart4Bars } from "~/resources/icons/BarChart4Bars";
import { DocumentSearch } from "~/resources/icons/DocumentSearch";
import { Flask } from "~/resources/icons/Flask";
import { FormatPaint } from "~/resources/icons/FormatPaint";
import { MobileArrowDown } from "~/resources/icons/MobileArrowDown";
import { OpenInNew } from "~/resources/icons/OpenInNew";
import { Translate } from "~/resources/icons/Translate";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { useHasNewUpdate } from "~/navigation/hooks/useHasNewUpdate";
import { StandardScrollLayout } from "~/navigation/layouts/StandardScroll";
import { BackupSheet } from "~/navigation/sheets/BackupSheet";
import { LanguageSheet } from "~/navigation/sheets/LanguageSheet";

import { APP_VERSION } from "~/constants/Config";
import * as LINKS from "~/constants/Links";
import { Divider } from "~/components/Divider";
import { SegmentedList } from "~/components/List/Segmented";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { Switch } from "~/components/UI/Switch";

export default function Settings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();
  const showRCNotification = usePreferenceStore((s) => s.rcNotification);
  const backupSheetRef = useSheetRef();
  const languageSheetRef = useSheetRef();

  return (
    <>
      <LanguageSheet ref={languageSheetRef} />
      <BackupSheet ref={backupSheetRef} />

      <StandardScrollLayout>
        {hasNewUpdate && (
          <SegmentedList.Item
            labelTextKey="feat.appUpdate.title"
            supportingText={t("feat.appUpdate.brief")}
            onPress={() => navigation.navigate("AppUpdate")}
            LeftElement={<MobileArrowDown color="onSecondary" />}
            className="gap-4 rounded-full bg-yellow"
            _textColor="text-neutral0"
          />
        )}

        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.appearance.title"
            onPress={() => navigation.navigate("AppearanceSettings")}
            LeftElement={<FormatPaint />}
            className="gap-4"
          />
          <SegmentedList.Item
            labelTextKey="feat.language.title"
            onPress={() => languageSheetRef.current?.present()}
            LeftElement={<Translate />}
            className="gap-4"
          />
        </SegmentedList>

        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.backup.title"
            onPress={() => backupSheetRef.current?.present()}
            LeftElement={<Archive />}
            className="gap-4"
          />
          <SegmentedList.Item
            labelTextKey="feat.insights.title"
            onPress={() => navigation.navigate("Insights")}
            LeftElement={<BarChart4Bars />}
            className="gap-4"
          />
          <SegmentedList.Item
            labelTextKey="feat.playback.title"
            onPress={() => navigation.navigate("PlaybackSettings")}
            LeftElement={<AutoPlay />}
            className="gap-4"
          />
          <SegmentedList.Item
            labelTextKey="feat.scanning.title"
            onPress={() => navigation.navigate("ScanningSettings")}
            LeftElement={<DocumentSearch />}
            className="gap-4"
          />
        </SegmentedList>

        <SegmentedList.Item
          labelTextKey="feat.experimental.title"
          onPress={() => navigation.navigate("ExperimentalSettings")}
          LeftElement={<Flask />}
          className="gap-4"
        />

        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.code.title"
            supportingText={t("feat.code.brief")}
            onPress={() => openBrowserAsync(LINKS.GITHUB)}
            RightElement={<OpenInNew />}
          />
          <SegmentedList.Item
            labelTextKey="feat.license.title"
            onPress={() => openBrowserAsync(LINKS.LICENSE)}
            RightElement={<OpenInNew />}
          />
          <SegmentedList.Item
            labelTextKey="feat.privacy.title"
            onPress={() => openBrowserAsync(LINKS.PRIVACY_POLICY)}
            RightElement={<OpenInNew />}
          />
          <SegmentedList.Item
            labelTextKey="feat.thirdParty.title"
            supportingText={t("feat.thirdParty.brief")}
            onPress={() => navigation.navigate("ThirdParty")}
          />
        </SegmentedList>

        <SegmentedList.CustomItem>
          <SegmentedList.Item
            labelTextKey="feat.version.title"
            supportingText={APP_VERSION}
            onPress={() => openBrowserAsync(LINKS.VERSION_CHANGELOG)}
            RightElement={<OpenInNew />}
            className="rounded-none"
            _psuedoClassName="active:bg-canvas/30"
          />
          <Divider className="mx-4" />
          <SegmentedList.Item
            labelTextKey="feat.version.extra.rcNotification"
            onPress={PreferenceTogglers.toggleRCNotification}
            RightElement={<Switch enabled={showRCNotification} />}
            className="rounded-none"
            _psuedoClassName="active:bg-canvas/30"
          />
        </SegmentedList.CustomItem>
      </StandardScrollLayout>
    </>
  );
}
