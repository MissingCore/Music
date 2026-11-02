// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";

import { ScrollLayout } from "~/navigation/layouts/ScrollLayout";
import { BackupSheet } from "./sheets/BackupSheet";
import { LanguageSheet } from "./sheets/LanguageSheet";

import { useSheetRef } from "~/components/next/base/sheet";
import * as List from "~/components/next/composed/list";
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

      <ScrollLayout title="term.settings">
        <List.Group>
          <List.Item
            icon="format-paint"
            label={t("feat.appearance.title")}
            onPress={() => navigation.navigate("AppearanceSettings")}
          />
          <List.Divider />
          <List.Item
            icon="translate"
            label={t("feat.language.title")}
            supporting={selectedLanguage?.label}
            onPress={() => languageSheetRef.current?.present()}
          />
        </List.Group>

        <List.Group>
          <List.Item
            icon="archive"
            label={t("feat.backup.title")}
            onPress={() => backupSheetRef.current?.present()}
          />
          <List.Divider />
          <List.Item
            icon="bar-chart-4-bars"
            label={t("feat.insights.title")}
            onPress={() => navigation.navigate("Insights")}
          />
          <List.Divider />
          <List.Item
            icon="document-search"
            label={t("feat.scanning.title")}
            onPress={() => navigation.navigate("ScanningSettings")}
          />
        </List.Group>

        <List.Group>
          <List.Item
            icon="graphic-eq"
            label={t("feat.audioEffects.title")}
            onPress={() => navigation.navigate("AudioEffects", {})}
          />
          <List.Divider />
          <List.Item
            icon="lyrics"
            label={t("feat.lyrics.title")}
            onPress={() => navigation.navigate("LyricsSettings")}
          />
          <List.Divider />
          <List.Item
            icon="autoplay"
            label={t("feat.playback.title")}
            onPress={() => navigation.navigate("PlaybackSettings")}
          />
        </List.Group>

        <List.Group>
          <List.Item
            icon="flask-filled"
            label={t("feat.experimental.title")}
            onPress={() => navigation.navigate("ExperimentalSettings")}
          />
          <List.Divider />
          <List.Item
            icon="info"
            label={t("term.about")}
            onPress={() => navigation.navigate("About")}
          />
        </List.Group>
      </ScrollLayout>
    </>
  );
}
