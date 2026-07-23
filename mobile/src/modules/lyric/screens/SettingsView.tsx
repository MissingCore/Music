// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import { Icon } from "~/resources/icons";
import { useLyricStore } from "../core/store";
import { toggleCheckEmbeddedLyrics } from "../core/actions";

import { ListLayout } from "~/navigation/layouts/ListLayout";

import { SegmentedList } from "~/components/List/Segmented";
import { Switch } from "~/components/UI/Switch";

export default function LyricsSettings() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const checkEmbeddedLyrics = useLyricStore((s) => s.checkEmbedded);

  return (
    <ListLayout>
      <SegmentedList>
        <SegmentedList.Item
          labelText="feat.lyrics.extra.providers"
          onPress={() => navigation.navigate("LyricsProviders")}
          Leading={<Icon name="search" />}
        />
        <SegmentedList.Item
          labelText={t("template.entryManage", {
            name: t("feat.lyrics.title"),
          })}
          onPress={() => navigation.navigate("Lyrics", {})}
          Leading={<Icon name="lyrics" />}
        />
      </SegmentedList>

      <SegmentedList.Item
        labelText="feat.lyrics.extra.useEmbedded"
        onPress={toggleCheckEmbeddedLyrics}
        Trailing={<Switch enabled={checkEmbeddedLyrics} />}
      />
    </ListLayout>
  );
}
