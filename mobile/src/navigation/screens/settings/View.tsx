// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Icon } from "~/resources/icons";

import { useHasNewUpdate } from "~/navigation/hooks/useHasNewUpdate";
import { ListLayout } from "~/navigation/layouts/ListLayout";
import { BackupSheet } from "./sheets/BackupSheet";
import { LanguageSheet } from "./sheets/LanguageSheet";

import { SegmentedList } from "~/components/List/Segmented";
import { useSheetRef } from "~/components/Sheet/useSheetRef";

export default function Settings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();
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

        <SegmentedList.Item
          labelText="term.about"
          onPress={() => navigation.navigate("About")}
        />
      </ListLayout>
    </>
  );
}
