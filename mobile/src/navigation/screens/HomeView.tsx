// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Trans, useTranslation } from "react-i18next";
import { View } from "react-native";

import { useSessionStore } from "~/stores/Session/store";

import { useHasNewUpdate } from "~/navigation/hooks/useHasNewUpdate";

import { Seconds } from "~/utils/date";
import { ScrollView } from "~/components/Base/ScrollView";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { Icon } from "~/components/next/base/icon";
import { Ripple } from "~/components/next/base/ripple";
import { Text, TText } from "~/components/next/base/typography";
import { IconButton } from "~/components/next/blocks/icon-button";
import { useTheme } from "~/modules/customization/theme/hooks";
import { RECENT_DAY_RANGE } from "~/modules/insights/core/constants";
import { useRecap } from "~/modules/insights/helpers/useRecap";

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
  const last7DaysEpoch = useSessionStore((s) => s.lastDaysStartEpoch);
  const { data } = useRecap(last7DaysEpoch);

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
            listeningTime: Seconds.toReadableTime(
              data?.overview.totalListeningTime ?? 0,
              true,
            ),
            playCount: t("feat.recap.extra.playCount", {
              count: data?.overview.totalPlays ?? 0,
            }).toLocaleLowerCase(),
            uniqueTracks: t("plural.track", {
              count: data?.overview.uniqueTracks ?? 0,
            }).toLocaleLowerCase(),
            amount: RECENT_DAY_RANGE,
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
