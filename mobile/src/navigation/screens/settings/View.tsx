// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

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
            labelText="feat.appUpdate.title"
            supportingText={t("feat.appUpdate.brief")}
            onPress={() => navigation.navigate("AppUpdate")}
            Leading={<Icon name="mobile-arrow-down" color="onSecondary" />}
            className="rounded-full bg-secondary"
            rippleColor="secondaryDim"
            _textColor="onSecondary"
          />
        )}

        <SegmentedList>
          <SegmentedList.Item
            labelText="feat.appearance.title"
            onPress={() => navigation.navigate("AppearanceSettings")}
            Leading={<Icon name="format-paint" />}
          />
          <SegmentedList.Item
            labelText="feat.language.title"
            onPress={() => languageSheetRef.current?.present()}
            Leading={<Icon name="translate" />}
          />
        </SegmentedList>

        <SegmentedList>
          <SegmentedList.Item
            labelText="feat.backup.title"
            onPress={() => backupSheetRef.current?.present()}
            Leading={<Icon name="archive" />}
          />
          <SegmentedList.Item
            labelText="feat.insights.title"
            onPress={() => navigation.navigate("Insights")}
            Leading={<Icon name="bar-chart-4-bars" />}
          />
        </SegmentedList>
        <SegmentedList>
          <SegmentedList.Item
            labelText="feat.audioEffects.title"
            onPress={() => navigation.navigate("AudioEffects", {})}
            Leading={<Icon name="graphic-eq" />}
          />
          <SegmentedList.Item
            labelText="feat.lyrics.title"
            onPress={() => navigation.navigate("LyricsSettings")}
            Leading={<Icon name="lyrics" />}
          />
          <SegmentedList.Item
            labelText="feat.playback.title"
            onPress={() => navigation.navigate("PlaybackSettings")}
            Leading={<Icon name="autoplay" />}
          />
          <SegmentedList.Item
            labelText="feat.scanning.title"
            onPress={() => navigation.navigate("ScanningSettings")}
            Leading={<Icon name="document-search" />}
          />
        </SegmentedList>

        <SegmentedList.Item
          labelText="feat.experimental.title"
          onPress={() => navigation.navigate("ExperimentalSettings")}
          Leading={<Icon name="flask-filled" />}
        />

        <SegmentedList>
          <SegmentedList.Item
            labelText="feat.code.title"
            supportingText={t("feat.code.brief")}
            onPress={() => openLink(Links.GitHub)}
            Trailing={<Icon name="open-in-new" />}
          />
          <SegmentedList.Item
            labelText="feat.license.title"
            onPress={() => openLink(Links.License)}
            Trailing={<Icon name="open-in-new" />}
          />
          <SegmentedList.Item
            labelText="feat.privacy.title"
            onPress={() => openLink(Links.PrivacyPolicy)}
            Trailing={<Icon name="open-in-new" />}
          />
          <SegmentedList.Item
            labelText="feat.thirdParty.title"
            supportingText={t("feat.thirdParty.brief")}
            onPress={() => navigation.navigate("ThirdParty")}
          />
        </SegmentedList>

        <SegmentedList.CustomItem>
          <SegmentedList.Item
            labelText="feat.appUpdate.extra.version"
            supportingText={APP_VERSION}
            onPress={() => openLink(Links.CurrentRelease)}
            Trailing={<Icon name="open-in-new" />}
            className="rounded-none"
          />
          <Divider className="mx-4" />
          <SegmentedList.Item
            labelText="feat.appUpdate.extra.checkUpdates"
            onPress={PreferenceTogglers.toggleKey("checkForUpdates")}
            Trailing={<Switch enabled={checkForUpdates} />}
            className="rounded-none"
          />
          <Divider className="mx-4" />
          <SegmentedList.Item
            labelText="feat.appUpdate.extra.rcNotification"
            onPress={PreferenceTogglers.toggleKey("rcNotification")}
            disabled={!checkForUpdates}
            Trailing={<Switch enabled={showRCNotification} />}
            className="rounded-none"
          />
        </SegmentedList.CustomItem>
      </ListLayout>
    </>
  );
}
