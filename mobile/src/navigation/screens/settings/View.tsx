// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";

import { ListLayout } from "~/navigation/layouts/ListLayout";
import { BackupSheet } from "./sheets/BackupSheet";
import { LanguageSheet } from "./sheets/LanguageSheet";
import * as SettingsList from "./components/SettingsList";

import { useSheetRef } from "~/components/next/base/sheet";
import { LANGUAGES } from "~/modules/i18n/constants";

export default function Settings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const languageCode = usePreferenceStore((s) => s.language);
  const backupSheetRef = useSheetRef();
  const languageSheetRef = useSheetRef();

  const selectedLanguage = LANGUAGES.find(({ code }) => code === languageCode);

  return (
    <>
      <LanguageSheet ref={languageSheetRef} />
      <BackupSheet ref={backupSheetRef} />

      <ListLayout>
        <SettingsList.Group>
          <SettingsList.Item
            icon="format-paint"
            label={t("feat.appearance.title")}
            onPress={() => navigation.navigate("AppearanceSettings")}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            icon="translate"
            label={t("feat.language.title")}
            supporting={selectedLanguage?.label}
            onPress={() => languageSheetRef.current?.present()}
          />
        </SettingsList.Group>

        <SettingsList.Group>
          <SettingsList.Item
            icon="archive"
            label={t("feat.backup.title")}
            onPress={() => backupSheetRef.current?.present()}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            icon="bar-chart-4-bars"
            label={t("feat.insights.title")}
            onPress={() => navigation.navigate("Insights")}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            icon="document-search"
            label={t("feat.scanning.title")}
            onPress={() => navigation.navigate("ScanningSettings")}
          />
        </SettingsList.Group>

        <SettingsList.Group>
          <SettingsList.Item
            icon="graphic-eq"
            label={t("feat.audioEffects.title")}
            onPress={() => navigation.navigate("AudioEffects", {})}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            icon="lyrics"
            label={t("feat.lyrics.title")}
            onPress={() => navigation.navigate("LyricsSettings")}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            icon="autoplay"
            label={t("feat.playback.title")}
            onPress={() => navigation.navigate("PlaybackSettings")}
          />
        </SettingsList.Group>

        <SettingsList.Group>
          <SettingsList.Item
            icon="flask-filled"
            label={t("feat.experimental.title")}
            onPress={() => navigation.navigate("ExperimentalSettings")}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            icon="info"
            label={t("term.about")}
            onPress={() => navigation.navigate("About")}
          />
        </SettingsList.Group>
      </ListLayout>
    </>
  );
}
