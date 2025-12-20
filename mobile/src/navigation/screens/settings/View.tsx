import { useNavigation } from "@react-navigation/native";
import { openBrowserAsync } from "expo-web-browser";
import { useTranslation } from "react-i18next";

import { OpenInNew } from "~/resources/icons/OpenInNew";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { useHasNewUpdate } from "~/navigation/hooks/useHasNewUpdate";
import { StandardScrollLayout } from "~/navigation/layouts/StandardScroll";
import { BackupSheet } from "~/navigation/sheets/BackupSheet";
import { LanguageSheet } from "~/navigation/sheets/LanguageSheet";

import { APP_VERSION } from "~/constants/Config";
import * as LINKS from "~/constants/Links";
import {
  SegmentedList,
  SegmentedListItem,
  SegmentedListItemGroup,
} from "~/components/DS-2/List/Segmented";
import { Divider } from "~/components/Divider";
import { Switch } from "~/components/Form/Switch";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { LANGUAGES } from "~/modules/i18n/constants";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();
  const showRCNotification = usePreferenceStore((s) => s.rcNotification);
  const backupSheetRef = useSheetRef();
  const languageSheetRef = useSheetRef();

  const currLang = LANGUAGES.find(({ code }) => code === i18n.language)?.name;

  return (
    <>
      <LanguageSheet ref={languageSheetRef} />
      <BackupSheet ref={backupSheetRef} />

      <StandardScrollLayout>
        {hasNewUpdate && (
          <SegmentedListItem
            labelTextKey="feat.appUpdate.title"
            supportingText={t("feat.appUpdate.brief")}
            onPress={() => navigation.navigate("AppUpdate")}
            className="rounded-full bg-yellow"
            _textColor="text-neutral0"
          />
        )}

        <SegmentedList>
          <SegmentedListItem
            labelTextKey="feat.appearance.title"
            supportingText={t("feat.appearance.brief")}
            onPress={() => navigation.navigate("AppearanceSettings")}
          />
          <SegmentedListItem
            labelTextKey="feat.language.title"
            supportingText={currLang ?? "English"}
            onPress={() => languageSheetRef.current?.present()}
          />
        </SegmentedList>

        <SegmentedList>
          <SegmentedListItem
            labelTextKey="feat.backup.title"
            supportingText={t("feat.backup.brief")}
            onPress={() => backupSheetRef.current?.present()}
          />
          <SegmentedListItem
            labelTextKey="feat.insights.title"
            supportingText={t("feat.insights.brief")}
            onPress={() => navigation.navigate("Insights")}
          />
          <SegmentedListItem
            labelTextKey="feat.playback.title"
            supportingText={t("feat.playback.brief")}
            onPress={() => navigation.navigate("PlaybackSettings")}
          />
          <SegmentedListItem
            labelTextKey="feat.scanning.title"
            supportingText={t("feat.scanning.brief")}
            onPress={() => navigation.navigate("ScanningSettings")}
          />
        </SegmentedList>

        <SegmentedListItem
          labelTextKey="feat.experimental.title"
          supportingText={t("feat.experimental.brief")}
          onPress={() => navigation.navigate("ExperimentalSettings")}
        />

        <SegmentedList>
          <SegmentedListItem
            labelTextKey="feat.code.title"
            supportingText={t("feat.code.brief")}
            onPress={() => openBrowserAsync(LINKS.GITHUB)}
            RightElement={<OpenInNew />}
          />
          <SegmentedListItem
            labelTextKey="feat.license.title"
            onPress={() => openBrowserAsync(LINKS.LICENSE)}
            RightElement={<OpenInNew />}
          />
          <SegmentedListItem
            labelTextKey="feat.privacy.title"
            onPress={() => openBrowserAsync(LINKS.PRIVACY_POLICY)}
            RightElement={<OpenInNew />}
          />
          <SegmentedListItem
            labelTextKey="feat.thirdParty.title"
            supportingText={t("feat.thirdParty.brief")}
            onPress={() => navigation.navigate("ThirdParty")}
          />
          <SegmentedListItemGroup>
            <SegmentedListItem
              labelTextKey="feat.version.title"
              supportingText={APP_VERSION}
              onPress={() => openBrowserAsync(LINKS.VERSION_CHANGELOG)}
              RightElement={<OpenInNew />}
              className="rounded-none"
              psuedoClassName="active:bg-canvas/30"
            />
            <Divider className="mx-4" />
            <SegmentedListItem
              labelTextKey="feat.version.extra.rcNotification"
              onPress={PreferenceTogglers.toggleRCNotification}
              RightElement={<Switch enabled={showRCNotification} />}
              className="rounded-none"
              psuedoClassName="active:bg-canvas/30"
            />
          </SegmentedListItemGroup>
        </SegmentedList>
      </StandardScrollLayout>
    </>
  );
}
