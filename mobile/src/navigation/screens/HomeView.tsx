// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Trans, useTranslation } from "react-i18next";
import { View } from "react-native";

import { useHasNewUpdate } from "~/navigation/hooks/useHasNewUpdate";

import { ScrollView } from "~/components/Base/ScrollView";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { Icon } from "~/components/next/base/icon";
import { Ripple } from "~/components/next/base/ripple";
import { Text, TText } from "~/components/next/base/typography";
import { IconButton } from "~/components/next/blocks/icon-button";
import { useTheme } from "~/modules/customization/theme/hooks";

export default function Home() {
  const { t } = useTranslation();
  const navigation = useNavigation();

  return (
    <>
      <Header />
      <ScrollView>
        <WeeklyRecap />

        <FilledIconButton
          icon="history"
          accessibilityLabel={t("feat.playedRecent.title")}
          onPress={() => navigation.navigate("RecentlyPlayed")}
        />
      </ScrollView>
    </>
  );
}

//#region Header
function Header() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();
  return (
    <View className="absolute inset-x-0 top-0 z-50 flex-row justify-end gap-4 p-4 pt-safe-offset-8">
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

//#region Weekly Recap
function WeeklyRecap() {
  const { t } = useTranslation();
  const { primary } = useTheme();

  return (
    <View>
      <View className="gap-2 bg-primary px-4 pt-40 pb-8">
        <TText
          textKey="feat.greeting.title"
          intent="accent"
          className="text-5xl leading-none! text-onPrimary"
        />
        <Trans
          i18nKey="feat.greeting.extra.weeklyRecap"
          parent={Text}
          values={{
            listeningTime: `${80} min`,
            playCount: t("feat.recap.extra.playCount", {
              count: 137,
            }).toLocaleLowerCase(),
            uniqueTracks: t("plural.track", { count: 87 }).toLocaleLowerCase(),
          }}
          components={{ b: <RecapStat /> }}
          className="max-w-md text-onPrimaryVariant"
        />
      </View>
      <LinearGradient
        colors={[`${primary}FF`, `${primary}00`]}
        className="h-16 w-full"
      />
    </View>
  );
}

function RecapStat({ children }: { children?: React.ReactNode }) {
  return (
    <Text bold className="text-onPrimary">
      {children}
    </Text>
  );
}
//#endregion
