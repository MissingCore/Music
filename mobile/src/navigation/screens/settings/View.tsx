// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { usePreferenceStore } from "~/stores/Preference/store";

import { useHasNewUpdate } from "~/navigation/hooks/useHasNewUpdate";
import { ListLayout } from "~/navigation/layouts/ListLayout";
import { BackupSheet } from "./sheets/BackupSheet";
import { LanguageSheet } from "./sheets/LanguageSheet";
import * as SettingsList from "./components/SettingsList";

import { useSheetRef } from "~/components/Sheet/useSheetRef";
import { LANGUAGES } from "~/modules/i18n/constants";

export default function Settings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();
  const languageCode = usePreferenceStore((s) => s.language);
  const backupSheetRef = useSheetRef();
  const languageSheetRef = useSheetRef();

  const selectedLanguage = LANGUAGES.find(({ code }) => code === languageCode);

  return (
    <>
      <LanguageSheet ref={languageSheetRef} />
      <BackupSheet ref={backupSheetRef} />

      <ListLayout>
        {hasNewUpdate && (
          <SettingsList.Container theme="secondary" className="rounded-full">
            <SettingsList.Item
              iconName="mobile-arrow-down"
              contentConfig={{ label: t("feat.appUpdate.brief") }}
              onPress={() => navigation.navigate("AppUpdate")}
            />
          </SettingsList.Container>
        )}

        <SettingsList.Container>
          <SettingsList.Item
            iconName="format-paint"
            contentConfig={{ label: t("feat.appearance.title") }}
            onPress={() => navigation.navigate("AppearanceSettings")}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            iconName="translate"
            contentConfig={{
              label: t("feat.language.title"),
              supporting: selectedLanguage?.name,
            }}
            onPress={() => languageSheetRef.current?.present()}
          />
        </SettingsList.Container>

        <SettingsList.Container>
          <SettingsList.Item
            iconName="graphic-eq"
            contentConfig={{ label: t("feat.audioEffects.title") }}
            onPress={() => navigation.navigate("AudioEffects", {})}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            iconName="autoplay"
            contentConfig={{ label: t("feat.playback.title") }}
            onPress={() => navigation.navigate("PlaybackSettings")}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            iconName="lyrics"
            contentConfig={{ label: t("feat.lyrics.title") }}
            onPress={() => navigation.navigate("LyricsSettings")}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            iconName="document-search"
            contentConfig={{ label: t("feat.scanning.title") }}
            onPress={() => navigation.navigate("ScanningSettings")}
          />
        </SettingsList.Container>

        <SettingsList.Container>
          <SettingsList.Item
            iconName="bar-chart-4-bars"
            contentConfig={{ label: t("feat.insights.title") }}
            onPress={() => navigation.navigate("Insights")}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            iconName="archive"
            contentConfig={{ label: t("feat.backup.title") }}
            onPress={() => backupSheetRef.current?.present()}
          />
        </SettingsList.Container>

        <SettingsList.Container>
          <SettingsList.Item
            iconName="flask-filled"
            contentConfig={{ label: t("feat.experimental.title") }}
            onPress={() => navigation.navigate("ExperimentalSettings")}
          />
          <SettingsList.Divider />
          <SettingsList.Item
            iconName="info"
            contentConfig={{ label: t("term.about") }}
            onPress={() => navigation.navigate("About")}
          />
        </SettingsList.Container>
      </ListLayout>
    </>
  );
}
