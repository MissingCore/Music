// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import BackgroundTimer from "@boterop/react-native-background-timer";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import type { LinearGradientProps } from "expo-linear-gradient";
import { LinearGradient } from "expo-linear-gradient";
import type { ParseKeys } from "i18next";
import { useCallback, useMemo } from "react";
import { Trans, useTranslation } from "react-i18next";
import { View } from "react-native";
import { easeGradient } from "react-native-easing-gradient";
import { ScrollView as GestureScrollView } from "react-native-gesture-handler";
import { createAnimatedComponent } from "react-native-reanimated";

import { Queue } from "~/stores/Playback/actions";
import { usePreferenceStore } from "~/stores/Preference/store";
import { useSessionStore } from "~/stores/Session/store";
import { viewPreferenceStore } from "~/stores/ViewPreference/store";
import type { LayoutItem } from "~/stores/ViewPreference/types";
import { useGetLayoutConfig } from "~/hooks/useLayoutConfigs";

import { useHasNewUpdate } from "../hooks/useHasNewUpdate";
import { useBottomActionsOffset } from "../components/BottomActions/useBottomActions";

import { cn } from "~/lib/style";
import { Seconds } from "~/utils/date";
import { chunkArray } from "~/utils/object";
import { LegendList } from "~/components/Base/LegendList";
import { ScrollView } from "~/components/Base/ScrollView";
import { Button } from "~/components/next/base/button";
import { IconButton } from "~/components/next/base/button-icon";
import { Icon } from "~/components/next/base/icon";
import { Text, TText } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";
import {
  TrackItem,
  TrackListContext,
} from "~/components/next/composed/track-item";
import { useTheme } from "~/modules/customization/theme/hooks";
import {
  useRecentlyDiscoveredTracks,
  useRecentlyPlayedTracks,
} from "~/modules/insights/core/RecentContentQuerier";
import { RECENT_DAY_RANGE } from "~/modules/insights/core/constants";
import { useRecap } from "~/modules/insights/helpers/useRecap";
import { ReservedPlaylists } from "~/modules/media/constants";

const AnimatedGestureScrollView = createAnimatedComponent(GestureScrollView);

const trackSource = {
  type: "playlist",
  id: ReservedPlaylists.tracks,
} as const;

export default function Home() {
  const queryClient = useQueryClient();
  const showNavbar = usePreferenceStore((s) => s.showNavbar);
  const last7DaysEpoch = useSessionStore((s) => s.lastDaysStartEpoch);
  const bottomOffset = useBottomActionsOffset({
    maxRows: showNavbar ? 2 : 1,
    rowAlwaysVisible: true,
  });

  useFocusEffect(
    useCallback(() => {
      const timeoutId = BackgroundTimer.setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ["insights", "recent", "tracks"],
        });
        queryClient.invalidateQueries({
          queryKey: ["insights", "recap", last7DaysEpoch],
        });
      }, 150);
      return () => BackgroundTimer.clearTimeout(timeoutId);
    }, [queryClient, last7DaysEpoch]),
  );

  return (
    <>
      <TopAppBar />
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomOffset }}
        contentContainerClassName="gap-8"
      >
        <WeeklyRecap />
        <TrackListContext value={trackSource}>
          <RecentlyPlayed />
          <RecentlyDiscovered />
        </TrackListContext>
        <HomeLinks />
      </ScrollView>
    </>
  );
}

//#region TopAppBar
function TopAppBar() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { hasNewUpdate } = useHasNewUpdate();
  return (
    <View className="absolute inset-x-0 top-0 z-50 flex-row justify-end gap-4 p-4 pt-safe-offset-8">
      {hasNewUpdate ? (
        <Button
          onPress={() => navigation.navigate("AppUpdate")}
          intent="secondary"
          className="shrink grow gap-3 rounded-full px-3 py-0"
        >
          <Icon name="mobile-arrow-down" color="onSecondary" />
          <TText
            textKey="feat.appUpdate.brief"
            intent="secondary"
            numberOfLines={2}
            className="shrink grow text-sm"
          />
          <Icon
            name="arrow-back"
            color="onSecondary"
            className="ltr:rotate-180"
          />
        </Button>
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
  const navigation = useNavigation();
  const { primary } = useTheme();
  const last7DaysEpoch = useSessionStore((s) => s.lastDaysStartEpoch);
  const { data } = useRecap(last7DaysEpoch);

  const { colors, locations } = useMemo(
    () =>
      easeGradient({
        colorStops: {
          0: { color: primary },
          1: { color: `${primary}00` },
        },
      }) as unknown as Pick<LinearGradientProps, "colors" | "locations">,
    [primary],
  );

  return (
    <View className="-mb-6">
      <View className="gap-4 bg-primary px-4 pt-48 pb-1">
        <TText
          textKey="feat.greeting.title"
          intent="primary"
          accent
          className="text-5xl"
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
        <IconButton
          icon="arrow-back"
          accessibilityLabel={t("template.entrySeeMore", {
            name: t("feat.recap.title"),
          })}
          onPress={() => navigation.navigate("Recap", { last7Days: true })}
          filled
          wide
          className="self-start ltr:rotate-180"
        />
      </View>
      <LinearGradient
        colors={colors}
        locations={locations}
        //? `-translate-y-1` is to counter-act the Android "grow" navigation
        //? transition animation, which may cause a gap to show between the
        //? gradient & 7 day recap container.
        className="h-32 w-full -translate-y-1"
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

//#region Recent Sections
/**
 * Update track preference to show recently discovered tracks. Returns boolean
 * indiciating that "Tracks" view preference has been changed.
 */
function updateTrackViewPreference() {
  const { trackIsAsc, trackOrder } = viewPreferenceStore.getState();

  const updatedPreferences: Array<[string, any]> = [];
  if (trackIsAsc !== false) updatedPreferences.push(["trackIsAsc", false]);
  if (trackOrder !== "discoverTime")
    updatedPreferences.push(["trackOrder", "discoverTime"]);

  if (updatedPreferences.length > 0)
    viewPreferenceStore.setState(Object.fromEntries(updatedPreferences));

  return updatedPreferences.length !== 0;
}

function RecentlyPlayed() {
  const navigation = useNavigation();
  const { data } = useRecentlyPlayedTracks();
  return (
    <RecentGroup
      label="feat.recent.extra.recentlyPlayed"
      onLabelPress={() => navigation.navigate("RecentlyPlayed")}
      data={data}
    />
  );
}
function RecentlyDiscovered() {
  const navigation = useNavigation();
  const { data } = useRecentlyDiscoveredTracks();
  return (
    <RecentGroup
      label="feat.recent.extra.recentlyDiscovered"
      onLabelPress={() => {
        updateTrackViewPreference();
        navigation.navigate("HomeScreens", { screen: "Tracks" });
      }}
      data={data}
      onTrackPlay={async () => {
        if (updateTrackViewPreference()) await Queue.synchronize();
      }}
    />
  );
}

const columnConfigs = { minWidth: 300, minCols: 1.25, gap: 8 };

function RecentGroup(props: {
  label: ParseKeys;
  onLabelPress: VoidFunction;
  data?: LayoutItem[];
  onTrackPlay?: () => void | Promise<void>;
}) {
  const { t } = useTranslation();
  const { width } = useGetLayoutConfig(columnConfigs);

  const groupedData = useMemo(() => {
    if (!props.data || props.data.length === 0) return null;
    return chunkArray(props.data, 3);
  }, [props.data]);

  if (!groupedData) return null;
  return (
    <>
      <Button
        accessibilityLabel={t(props.label)}
        onPress={props.onLabelPress}
        filled={false}
        className="-mb-6 justify-start gap-2 rounded-none py-1"
      >
        <Marquee wrapperClassName="grow-0">
          <TText textKey={props.label} accent size="3xl" />
        </Marquee>
        <Icon
          name="keyboard-arrow-right"
          size={32}
          className="rtl:rotate-180"
        />
      </Button>
      <LegendList
        horizontal
        estimatedItemSize={186}
        data={groupedData}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={({ item }) => (
          <LegendList
            estimatedItemSize={62} // 56px Height + 6px Margin Bottom
            data={item}
            keyExtractor={({ id }) => id}
            renderItem={({ item }) => (
              <TrackItem {...item} _onAfterPlayPress={props.onTrackPlay} />
            )}
            scrollEnabled={false}
            style={{ width }}
          />
        )}
        // @ts-expect-error - This is compatible.
        renderScrollComponent={AnimatedGestureScrollView}
        className="-mx-0.75 -mb-1.5"
        contentContainerClassName="px-4"
      />
    </>
  );
}
//#endregion

//#region Home Links
const linkMap = [
  { icon: "album", labelKey: "term.albums", screen: "Albums" },
  { icon: "artist", labelKey: "term.artists", screen: "Artists" },
  { icon: "folder", labelKey: "term.folders", screen: "Folders" },
  { icon: "genres", labelKey: "term.genres", screen: "Genres" },
  { icon: "list", labelKey: "term.playlists", screen: "Playlists" },
  { icon: "music-note", labelKey: "term.tracks", screen: "Tracks" },
] as const;

function HomeLinks() {
  const navigation = useNavigation();
  return (
    <View className="gap-0.75 px-4">
      {linkMap.map(({ icon, labelKey, screen }, idx) => (
        <Button
          key={labelKey}
          onPress={() => navigation.navigate("HomeScreens", { screen })}
          className={cn("rounded-xs p-3", {
            "rounded-t-xl": idx === 0,
            "rounded-b-xl": idx === linkMap.length - 1,
          })}
        >
          <Icon name={icon} size={32} />
          <Marquee>
            <TText textKey={labelKey} />
          </Marquee>
          <Icon
            name="keyboard-arrow-right"
            size={32}
            className="rtl:rotate-180"
          />
        </Button>
      ))}
    </View>
  );
}
//#endregion
