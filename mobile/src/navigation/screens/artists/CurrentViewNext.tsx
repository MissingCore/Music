// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { LinearGradientProps } from "expo-linear-gradient";
import { LinearGradient } from "expo-linear-gradient";
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";
import type { TabBarProps } from "react-native-collapsible-tabs-native";
import {
  CollapsibleTabView,
  createTabList,
} from "react-native-collapsible-tabs-native";
import { easeGradient } from "react-native-easing-gradient";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  interpolate,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { MediaDetails } from "~/adapters/types";
import { useArtistDetails } from "~/data/artist/queries";
import { PlaybackControls } from "~/stores/Playback/actions";
import {
  useGridLayoutConfig,
  useListLayoutConfig,
} from "~/hooks/useLayoutConfigs";

import { ArtistArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";
import { CurrentListMenu } from "~/navigation/components/CurrentListMenu";

import { getImageUri } from "~/lib/file-system";
import { OnRTL } from "~/lib/react";
import type { ExtractQueryData } from "~/lib/react-query";
import { withAlpha } from "~/utils/color";
import { Seconds } from "~/utils/date";
import { isString } from "~/utils/validation";
import { FlatList, useFlatListRef } from "~/components/Base/List";
import type { LegendListSignature } from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import { IconButton } from "~/components/next/base/button-icon";
import { BlurIconButton } from "~/components/next/base/blur-button-icon";
import { Icon } from "~/components/next/base/icon";
import { TextInput } from "~/components/next/base/input";
import { useSheetRef } from "~/components/next/base/sheet";
import { Marquee } from "~/components/next/blocks/marquee";
import { ImageCard } from "~/components/next/composed/image-card";
import {
  TrackItem,
  TrackListContext,
} from "~/components/next/composed/track-item";
import { Image } from "~/components/next/primitive/image";
import { Pressable } from "~/components/next/primitive/pressable";
import { Ripple } from "~/components/next/themed/ripple";
import { Text } from "~/components/next/themed/typography";
import {
  ThemeProvider,
  useTheme,
  useTintedDominantColor,
} from "~/modules/customization/theme/core/context";
import { Search, useSearchStore } from "~/modules/search/components/SearchList";
import { containSorter } from "~/modules/search/utils";

const HeaderProgressContext = createContext<SharedValue<number>>(null as never);

const TabLegendList = createTabList(LegendList) as LegendListSignature;

type ArtistDetail = ExtractQueryData<typeof useArtistDetails>;

type Props = StaticScreenProps<{ id: string }>;

export default function Artist({
  route: {
    params: { id: artistName },
  },
}: Props) {
  const { isPending, error, data } = useArtistDetails(artistName);
  const mainColor = useTintedDominantColor(data?.imageSource);
  const headerProgress = useSharedValue(0);

  const trackSource = useMemo(
    () => ({ type: "artist", id: artistName }) as const,
    [artistName],
  );

  const AtmosphereTheme = useMemo(
    () =>
      ({
        primary: "#FFFFFF",
        ...(mainColor ? { surface: mainColor } : {}),
        surfaceContainerHigh: "#C8C8C8",
        onSurface: "#FFFFFF",
        onSurfaceVariant: withAlpha("#FFF", 0.8),
      }) as const,
    [mainColor],
  );

  if (isPending || error) return null;
  return (
    <Search.Provider>
      <HeaderProgressContext value={headerProgress}>
        <ThemeProvider theme={AtmosphereTheme}>
          <View style={{ backgroundColor: mainColor }} className="grow">
            <TopAppBar
              id={artistName}
              name={data.name}
              trackIds={(data.topTracks ?? []).map(({ id }) => id)}
            />
            <TrackListContext value={trackSource}>
              <ScreenContents data={data} />
            </TrackListContext>
          </View>
        </ThemeProvider>
      </HeaderProgressContext>
    </Search.Provider>
  );
}

//#region Top App Bar
function TopAppBar(props: { id: string; name: string; trackIds: string[] }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const sheetRef = useSheetRef();
  return (
    <>
      <ArtistArtworkSheet ref={sheetRef} id={props.id} />
      <View className="absolute inset-x-0 top-0 z-50 flex-row items-center justify-between p-2 pt-safe-offset-2">
        <BlurIconButton
          icon={OnRTL.decide("east", "west")}
          accessibilityLabel={t("form.back")}
          onPress={() => navigation.goBack()}
        />
        <CurrentListMenu
          name={props.name}
          trackIds={props.trackIds}
          presentArtworkSheet={() => sheetRef.current?.present()}
        />
      </View>
    </>
  );
}
//#endregion

//#region Screen Contents
type AvailableRoutes = "topTracks" | "albums" | "eps" | "singles";

function ScreenContents({ data }: { data: ArtistDetail }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [tabIndex, setTabIndex] = useState(0);
  const headerProgress = use(HeaderProgressContext);

  const routes = useMemo(() => {
    const routes: Array<{ key: AvailableRoutes; title: string }> = [];
    if (!data) return routes;
    if (data.topTracks)
      routes.push({
        key: "topTracks",
        title: t("feat.recap.extra.top", { name: t("term.tracks") }),
      });
    if (data.albums) routes.push({ key: "albums", title: t("term.albums") });
    if (data.eps) routes.push({ key: "eps", title: t("term.eps") });
    if (data.singles) routes.push({ key: "singles", title: t("term.singles") });

    return routes;
  }, [t, data]);

  return (
    <CollapsibleTabView
      headerMinHeight={56 + insets.top}
      navigationState={{ index: tabIndex, routes }}
      onIndexChange={setTabIndex}
      renderHeader={() => <ScreenHeader {...data} />}
      renderTabBar={(args) => <RenderedTabBar {...args} />}
      renderScene={({ route }) => (
        // @ts-expect-error - `asGrid` is `true | false`.
        <RenderedList
          asGrid={route.key === "albums" || route.key === "eps"}
          data={data[route.key]!}
        />
      )}
      onHeaderOffsetChange={(e) => {
        "worklet";
        if (e.nativeEvent.collapsibleHeight === 0) return;
        headerProgress.set(
          e.nativeEvent.offset / e.nativeEvent.collapsibleHeight,
        );
      }}
    />
  );
}
//#endregion

//#region Header
function ScreenHeader(
  props: Pick<
    ArtistDetail,
    "name" | "imageSource" | "numTracks" | "totalDuration"
  >,
) {
  const { t } = useTranslation();
  const trackSource = use(TrackListContext);
  const { width, height } = useWindowDimensions();
  const { surface, onSurface } = useTheme();
  const headerProgress = use(HeaderProgressContext);
  const headerHeight = Math.min(400, width, height);

  const animatedStyles = useAnimatedStyle(() => ({
    opacity: interpolate(headerProgress.get(), [0.5, 1], [1, 0]),
  }));

  const { colors, locations } = useMemo(
    () =>
      easeGradient({
        colorStops: {
          0: { color: withAlpha(surface, 0) },
          1: { color: surface },
        },
      }) as unknown as Pick<LinearGradientProps, "colors" | "locations">,
    [surface],
  );

  return (
    <View
      style={{ height: headerHeight, backgroundColor: surface }}
      className="relative w-full items-center justify-end"
    >
      <Image
        source={isString(props.imageSource) ? props.imageSource : null}
        contentFit="cover"
        contentPosition="top"
        className="absolute inset-0 size-full"
      />
      <LinearGradient
        colors={colors}
        locations={locations}
        style={{ height: headerHeight * 0.6 }}
        className="absolute inset-x-0 bottom-0 w-full"
      />

      <Animated.View style={animatedStyles} className="w-full p-4">
        <Marquee center>
          <Text bold size="4xl">
            {props.name}
          </Text>
        </Marquee>
        <Marquee
          center
          contentContainerClassName="mt-2 mb-4 flex-row items-center"
        >
          <Text size="sm" color="onSurfaceVariant">
            {t("plural.track", { count: props.numTracks })}
          </Text>
          {/* Work around for RTL languages. */}
          <Text size="sm" color="onSurfaceVariant">
            {" • "}
          </Text>
          <Icon name="schedule" size={16} color="onSurfaceVariant" />
          <Text size="sm" color="onSurfaceVariant">
            {` ${Seconds.toReadableTime(props.totalDuration, true)}`}
          </Text>
        </Marquee>
        <Ripple
          onPress={() => PlaybackControls.playFromList({ source: trackSource })}
          surfaceColor="onSurface"
          style={{ backgroundColor: onSurface }}
          className="min-h-12 min-w-32 flex-row items-center justify-center gap-1 self-center rounded-full p-2"
        >
          <Icon name="play-arrow-filled" size={32} color="surface" />
        </Ripple>
      </Animated.View>
    </View>
  );
}
//#endregion

//#region Rendered Tab Bar
function RenderedTabBar(props: TabBarProps) {
  const { t } = useTranslation();
  const { surface, onSurface } = useTheme();
  const [searchEnabled, setSearchEnabled] = useState(false);
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);
  const prevTabIndex = useRef(0);
  const tabListRef = useFlatListRef();

  if (props.index !== prevTabIndex.current) {
    prevTabIndex.current = props.index;
    tabListRef.current?.scrollToIndex({
      index: props.index,
      viewPosition: 0.5,
    });
  }

  return (
    <Animated.View
      style={{ backgroundColor: surface }}
      className="flex-row items-center gap-4 pl-2"
    >
      <Animated.View
        layout={LinearTransition}
        className="flex-row items-center overflow-hidden"
      >
        <IconButton
          icon={searchEnabled ? "close" : "search"}
          accessibilityLabel={t(
            searchEnabled ? "form.close" : "feat.search.title",
          )}
          onPress={() => {
            setSearchEnabled((prev) => !prev);
            if (searchEnabled) setQuery("");
          }}
        />
        {searchEnabled ? (
          <TextInput
            value={query}
            onChangeText={setQuery}
            style={{ borderColor: onSurface, color: onSurface }}
            className="h-10 min-h-0 w-full max-w-48 border-b-2"
          />
        ) : null}
      </Animated.View>

      <Animated.View layout={LinearTransition} className="shrink grow">
        <FlatList
          ref={tabListRef}
          horizontal
          data={props.routes}
          keyExtractor={({ key }) => key}
          renderItem={({ item: { title }, index }) => (
            <Pressable
              onPress={() => props.onIndexChange(index)}
              className="min-w-12"
            >
              <Text
                bold
                center
                size="lg"
                color={props.index === index ? "onSurface" : "onSurfaceVariant"}
              >
                {title}
              </Text>
            </Pressable>
          )}
          contentContainerClassName="gap-6 p-4 pl-0"
        />
      </Animated.View>
    </Animated.View>
  );
}
//#endregion

//#region Rendered Lists
type RenderedListProps =
  | { asGrid: true; data: MediaDetails.DisplayAlbum[] }
  | { asGrid?: false; data: MediaDetails.DisplayTrack[] };

function RenderedList(props: RenderedListProps) {
  const navigation = useNavigation();
  const layout = (props.asGrid ? useGridLayoutConfig : useListLayoutConfig)();
  const bottomOffset = useBottomActionsOffset();
  const query = useSearchStore((s) => s.query);

  const filteredData = useMemo(
    // @ts-expect-error - Data can be filtered.
    () => containSorter(props.data, query, "name"),
    [props.data, query],
  );

  const renderAlbum = useCallback(
    ({ item }: { item: MediaDetails.DisplayAlbum }) => (
      <ImageCard
        src={item.artwork}
        size={layout.width}
        label={item.name}
        supporting={item.year}
        onPress={() =>
          navigation.navigate("Album", { id: item.id }, { pop: true })
        }
      />
    ),
    [navigation, layout.width],
  );
  const renderTrack = useCallback(
    ({ item }: { item: MediaDetails.DisplayTrack }) => (
      <TrackItem
        id={item.id}
        title={item.name}
        description={item.album ?? "—"}
        imageSource={getImageUri(item.artwork)}
      />
    ),
    [],
  );

  return (
    <TabLegendList
      numColumns={layout.count}
      estimatedItemSize={layout.width + 6}
      data={filteredData}
      keyExtractor={({ id }: { id: string }) => id}
      // @ts-expect-error - Data will render the item correctly.
      renderItem={props.asGrid ? renderAlbum : renderTrack}
      className="-mx-0.75"
      contentContainerStyle={{ paddingBottom: bottomOffset }}
      contentContainerClassName="gap-y-1.5 p-4"
    />
  );
}
//#endregion
