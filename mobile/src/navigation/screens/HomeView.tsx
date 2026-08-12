// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { getExternalAudioUris } from "@missingcore/native-utils/media";
import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useFavoriteListsForCards } from "~/data/favorite/queries";

import { NScrollLayout } from "~/navigation/layouts/NScrollLayout";

import { LegendList } from "~/components/Base/LegendList";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { StyledText, TEm } from "~/components/Typography/StyledText";
import { useMediaCardListPreset } from "~/modules/media/components/MediaCard";

export default function Home() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <NScrollLayout
      titleKey="term.home"
      Actions={
        <FilledIconButton
          icon="history"
          accessibilityLabel={t("feat.playedRecent.title")}
          onPress={() => navigation.navigate("RecentlyPlayed")}
        />
      }
    >
      <ExternalDriveNames />
      <TEm textKey="term.favorites" className="-mb-4" />
      <Favorites />
    </NScrollLayout>
  );
}

function ExternalDriveNames() {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    getExternalAudioUris().then(setNames).catch(console.log);
  }, []);

  return (
    <View className="gap-0.5">
      {names.map((name) => (
        <StyledText key={name}>{name}</StyledText>
      ))}
    </View>
  );
}

//#region Favorites
/** Display list of content we've favorited. */
function Favorites() {
  const { data } = useFavoriteListsForCards();
  const presets = useMediaCardListPreset({ data });
  return <LegendList {...presets} />;
}
//#endregion
