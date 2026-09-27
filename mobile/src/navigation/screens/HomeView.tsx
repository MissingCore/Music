// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

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
import { FlatList } from "~/components/Base/List";
import { ScrollView } from "~/components/Base/ScrollView";
import { Icon } from "~/components/next/base/icon";
import { Ripple } from "~/components/next/base/ripple";
import { Text, TText } from "~/components/next/base/typography";
import { IconButton } from "~/components/next/blocks/icon-button";
import { Marquee } from "~/components/next/blocks/marquee";
import { TrackItem } from "~/components/next/composed/track-item";
import { useTheme } from "~/modules/customization/theme/hooks";
import {
  useRecentlyDiscoveredTracks,
  useRecentlyPlayedTracks,
} from "~/modules/insights/core/RecentContentQuerier";
import { RECENT_DAY_RANGE } from "~/modules/insights/core/constants";
import { useRecap } from "~/modules/insights/helpers/useRecap";
import { ReservedPlaylists } from "~/modules/media/constants";

const AnimatedGestureScrollView = createAnimatedComponent(GestureScrollView);

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
      queryClient.invalidateQueries({
        queryKey: ["insights", "recent", "tracks"],
      });
      queryClient.invalidateQueries({
        queryKey: ["insights", "recap", last7DaysEpoch],
      });
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
        <RecentlyPlayed />
        <RecentlyDiscovered />
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

const trackSource = {
  type: "playlist",
  id: ReservedPlaylists.tracks,
} as const;

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
      <Ripple
        accessibilityLabel={t(props.label)}
        onPress={props.onLabelPress}
        className="-mb-6 flex-row items-center gap-2 px-4 py-1"
      >
        <Marquee wrapperClassName="grow-0">
          <TText
            textKey={props.label}
            intent="accent"
            className="leading-none!"
          />
        </Marquee>
        <View className="rtl:rotate-180">
          <Icon name="keyboard-arrow-right" size={32} />
        </View>
      </Ripple>
      <FlatList
        horizontal
        data={groupedData}
        keyExtractor={(_, idx) => String(idx)}
        renderItem={({ item }) => (
          <FlatList
            data={item}
            keyExtractor={({ id }) => id}
            renderItem={({ item }) => (
              <TrackItem
                {...item}
                trackSource={trackSource}
                _onAfterPlayPress={props.onTrackPlay}
              />
            )}
            scrollEnabled={false}
            style={{ width }}
          />
        )}
        // @ts-expect-error - This is compatible.
        renderScrollComponent={AnimatedGestureScrollView}
        columnWrapperClassName="gap-2"
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
        <Ripple
          key={labelKey}
          onPress={() => navigation.navigate("HomeScreens", { screen })}
          className={cn(
            "flex-row items-center gap-4 rounded-xs bg-surfaceContainerLowest p-3",
            idx === 0 && "rounded-t-lg",
            idx === linkMap.length - 1 && "rounded-b-lg",
          )}
        >
          <Icon name={icon} size={32} />
          <Marquee>
            <TText textKey={labelKey} />
          </Marquee>
          <View className="rtl:rotate-180">
            <Icon name="keyboard-arrow-right" size={32} />
          </View>
        </Ripple>
      ))}
    </View>
  );
}
//#endregion
