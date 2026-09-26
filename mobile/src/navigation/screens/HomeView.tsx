// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

import { useFavoriteListsForCards } from "~/data/favorite/queries";

import { NScrollLayout } from "~/navigation/layouts/NScrollLayout";
import { useHasNewUpdate } from "~/navigation/hooks/useHasNewUpdate";

import { LegendList } from "~/components/Base/LegendList";
import { ScrollView } from "~/components/Base/ScrollView";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { TEm } from "~/components/Typography/StyledText";
import { Icon } from "~/components/next/base/icon";
import { Ripple } from "~/components/next/base/ripple";
import { TText } from "~/components/next/base/typography";
import { IconButton } from "~/components/next/blocks/icon-button";
import { useMediaCardListPreset } from "~/modules/media/components/MediaCard";

export default function Home() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <ScrollView stickyHeaderIndices={[0]}>
      <Header />
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
        <TEm textKey="term.favorites" className="-mb-4" />
        <Favorites />
      </NScrollLayout>
    </ScrollView>
  );
}

//#region Header
function Header() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();
  return (
    <View className="z-50 flex-row justify-end gap-4 p-4 pt-safe-offset-8">
      {hasNewUpdate ? (
        <Ripple
          rippleColor="secondaryDim"
          onPress={() => navigation.navigate("AppUpdate")}
          className="shrink grow flex-row items-center gap-3 rounded-full bg-secondary px-3"
        >
          <Icon name="mobile-arrow-down" color="onSecondary" />
          <TText
            textKey="feat.appUpdate.brief"
            intent="secondary"
            numberOfLines={2}
            className="shrink grow text-sm"
          />
          <View className="ltr:rotate-180">
            <Icon name="arrow-back" color="onSecondary" />
          </View>
        </Ripple>
      ) : null}
      <IconButton
        icon="settings"
        accessibilityLabel={t("term.settings")}
        onPress={() => navigation.navigate("Settings")}
        size="lg"
        filled
      />
    </View>
  );
}
//#endregion

//#region Favorites
/** Display list of content we've favorited. */
function Favorites() {
  const { data } = useFavoriteListsForCards();
  const presets = useMediaCardListPreset({ data });
  return <LegendList {...presets} />;
}
//#endregion
