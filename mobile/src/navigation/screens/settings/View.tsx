import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Icon } from "~/resources/icons";
import { usePreferenceStore } from "~/stores/Preference/store";
import { PreferenceTogglers } from "~/stores/Preference/actions";

import { useHasNewUpdate } from "~/navigation/hooks/useHasNewUpdate";
import { ListLayout } from "~/navigation/layouts/ListLayout";
import { BackupSheet } from "./sheets/BackupSheet";
import { LanguageSheet } from "./sheets/LanguageSheet";

import { APP_VERSION } from "~/constants/Config";
import { Links, openLink } from "~/lib/web-browser";
import { Divider } from "~/components/Divider";
import { SegmentedList } from "~/components/List/Segmented";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { Switch } from "~/components/UI/Switch";

export default function Settings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();
  const checkForUpdates = usePreferenceStore((s) => s.checkForUpdates);
  const showRCNotification = usePreferenceStore((s) => s.rcNotification);
  const backupSheetRef = useSheetRef();
  const languageSheetRef = useSheetRef();

  return (
    <>
      <LanguageSheet ref={languageSheetRef} />
      <BackupSheet ref={backupSheetRef} />

      <ListLayout>
        {hasNewUpdate && (
          <SegmentedList.Item
            labelTextKey="feat.appUpdate.title"
            supportingText={t("feat.appUpdate.brief")}
            onPress={() => navigation.navigate("AppUpdate")}
            LeftElement={<Icon name="mobile-arrow-down" color="onSecondary" />}
            className="gap-4 rounded-full bg-secondary"
            _psuedoClassName="active:bg-secondaryDim"
            _textColor="onSecondary"
          />
        )}

        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.appearance.title"
            onPress={() => navigation.navigate("AppearanceSettings")}
            LeftElement={<Icon name="format-paint" />}
            className="gap-4"
          />
          <SegmentedList.Item
            labelTextKey="feat.language.title"
            onPress={() => languageSheetRef.current?.present()}
            LeftElement={<Icon name="translate" />}
            className="gap-4"
          />
        </SegmentedList>

        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.backup.title"
            onPress={() => backupSheetRef.current?.present()}
            LeftElement={<Icon name="archive" />}
            className="gap-4"
          />
          <SegmentedList.Item
            labelTextKey="feat.insights.title"
            onPress={() => navigation.navigate("Insights")}
            LeftElement={<Icon name="bar-chart-4-bars" />}
            className="gap-4"
          />
        </SegmentedList>
        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.audioEffects.title"
            onPress={() => navigation.navigate("AudioEffects", {})}
            LeftElement={<Icon name="graphic-eq" />}
            className="gap-4"
          />
          <SegmentedList.Item
            labelTextKey="feat.lyrics.title"
            onPress={() => navigation.navigate("Lyrics", {})}
            LeftElement={<Icon name="lyrics" />}
            className="gap-4"
          />
          <SegmentedList.Item
            labelTextKey="feat.playback.title"
            onPress={() => navigation.navigate("PlaybackSettings")}
            LeftElement={<Icon name="autoplay" />}
            className="gap-4"
          />
          <SegmentedList.Item
            labelTextKey="feat.scanning.title"
            onPress={() => navigation.navigate("ScanningSettings")}
            LeftElement={<Icon name="document-search" />}
            className="gap-4"
          />
        </SegmentedList>

        <SegmentedList.Item
          labelTextKey="feat.experimental.title"
          onPress={() => navigation.navigate("ExperimentalSettings")}
          LeftElement={<Icon name="flask-filled" />}
          className="gap-4"
        />

        <SegmentedList>
          <SegmentedList.Item
            labelTextKey="feat.code.title"
            supportingText={t("feat.code.brief")}
            onPress={() => openLink(Links.GitHub)}
            RightElement={<Icon name="open-in-new" />}
          />
          <SegmentedList.Item
            labelTextKey="feat.license.title"
            onPress={() => openLink(Links.License)}
            RightElement={<Icon name="open-in-new" />}
          />
          <SegmentedList.Item
            labelTextKey="feat.privacy.title"
            onPress={() => openLink(Links.PrivacyPolicy)}
            RightElement={<Icon name="open-in-new" />}
          />
          <SegmentedList.Item
            labelTextKey="feat.thirdParty.title"
            supportingText={t("feat.thirdParty.brief")}
            onPress={() => navigation.navigate("ThirdParty")}
          />
        </SegmentedList>

        <SegmentedList.CustomItem>
          <SegmentedList.Item
            labelTextKey="feat.appUpdate.extra.version"
            supportingText={APP_VERSION}
            onPress={() => openLink(Links.CurrentRelease)}
            RightElement={<Icon name="open-in-new" />}
            className="rounded-none"
          />
          <Divider className="mx-4" />
          <SegmentedList.Item
            labelTextKey="feat.appUpdate.extra.checkUpdates"
            onPress={PreferenceTogglers.toggleKey("checkForUpdates")}
            RightElement={<Switch enabled={checkForUpdates} />}
            className="rounded-none"
          />
          <Divider className="mx-4" />
          <SegmentedList.Item
            labelTextKey="feat.appUpdate.extra.rcNotification"
            onPress={PreferenceTogglers.toggleKey("rcNotification")}
            disabled={!checkForUpdates}
            RightElement={<Switch enabled={showRCNotification} />}
            className="rounded-none"
          />
        </SegmentedList.CustomItem>
      </ListLayout>
    </>
  );
}
