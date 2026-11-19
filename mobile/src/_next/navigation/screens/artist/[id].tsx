// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type {
  GenericNavigation,
  RootParamList,
  StaticScreenProps,
} from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";
import type { TabBarProps } from "react-native-collapsible-tabs-native";
import {
  CollapsibleTabView,
  createTabList,
} from "react-native-collapsible-tabs-native";
import { useShallow } from "zustand/react/shallow";

import { LocalMediaAdapter } from "~/_next/adapters/local-media";
import type { MediaItem } from "~/_next/adapters/types";
import { q } from "~/_next/data/key-store";

import { PlaybackControls } from "~/stores/Playback/actions";
import { usePlayFromSource } from "~/_next/context/play-from-context";
import { useSearchStore } from "~/_next/context/search-context";
import { ThemeProvider, useTheme } from "~/_next/context/theme-context";
import { useLayoutColumn } from "~/_next/hooks/use-column";
import { useDimmedImageColor } from "~/_next/hooks/use-dimmed-image-color";

import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";
import { GoBack } from "~/_next/navigation/components/go-back";

import { getImageUri } from "~/lib/file-system";
import type { ExtractQueryData } from "~/lib/react-query";
import type { PlayFromSource } from "~/_next/constants/media";
import { Seconds } from "~/_next/utils/date";
import { OnRTL } from "~/_next/utils/i18n";
import { containSorter } from "~/_next/utils/search";
import { cn } from "~/_next/utils/style";
import {
  FlatList,
  useFlatListRef,
} from "~/_next/components/primitives/flat-list";
import { Image } from "~/_next/components/primitives/image";
import type { LegendListSignature } from "~/_next/components/primitives/legend-list";
import { LegendList } from "~/_next/components/primitives/legend-list";
import { Pressable } from "~/_next/components/primitives/pressable";
import { BlurContainer } from "~/_next/components/blur-container";
import { ChipButton } from "~/_next/components/button-chip";
import { IconButton } from "~/_next/components/button-icon";
import { Divider } from "~/_next/components/divider";
import { TransitionGradient } from "~/_next/components/gradient";
import { Icon } from "~/_next/components/icon";
import { ImageCard, ImageListItem } from "~/_next/components/image-item";
import { TextInput } from "~/_next/components/input";
import { Marquee } from "~/_next/components/marquee";
import { Text, TText } from "~/_next/components/typography";

type ScreenData = ExtractQueryData<typeof useArtist>;
type ScreenTab = "discography" | "top-tracks";

function useArtist(id: string) {
  return useQuery({
    queryKey: q.artist.detail(id),
    queryFn: () => LocalMediaAdapter.artist.get(id),
    select: ({ artwork, ...rest }) => ({
      ...rest,
      artwork: getImageUri(artwork),
    }),
  });
}

type Props = StaticScreenProps<{ id: string }>;

export default function Artist({
  route: {
    params: { id },
  },
}: Props) {
  const { t } = useTranslation();
  const { isPending, error, data } = useArtist(id);

  //#region Theming
  const backgroundColor = useDimmedImageColor(data?.artwork);
  const ScreenTheme = useMemo(
    () =>
      ({
        background: backgroundColor,
        text: "#FFFFFF",
      }) as const,
    [backgroundColor],
  );
  //#endregion

  //#region Tabs
  const [tabIndex, setTabIndex] = useState(0);
  const routes = useMemo(() => {
    const routes: Array<{ key: ScreenTab; title: string }> = [
      { key: "discography", title: t("term.discography") },
    ];
    if ((data?.topTracks.length || 0) > 0)
      routes.push({
        key: "top-tracks",
        title: t("feat.recap.extra.top", { name: t("term.tracks") }),
      });
    return routes;
  }, [t, data?.topTracks.length]);
  //#endregion

  if (isPending) return <Text>Loading...</Text>;
  if (error) return <GoBack />;
  return (
    <ThemeProvider colors={ScreenTheme}>
      <View style={{ backgroundColor }} className="grow">
        <ScreenActions />
        <CollapsibleTabView
          navigationState={{ index: tabIndex, routes }}
          onIndexChange={setTabIndex}
          renderHeader={() => (
            <ScreenHeader
              name={data.name}
              artwork={data.artwork}
              metadata={t("plural.track", { count: data.numTracks })}
              duration={data.totalDuration}
            />
          )}
          renderTabBar={ScreenTabBar}
          renderScene={({ route: { key } }) =>
            key === "discography" ? (
              <DiscographyTab
                discography={data.discography}
                related={data.related}
              />
            ) : (
              <TopTracksTab topTracks={data.topTracks} />
            )
          }
          pinTabBar={false}
          swipeEnabled={routes.length > 1}
        />
      </View>
    </ThemeProvider>
  );
}

//#region Top App Bar
function ScreenActions() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <View className="absolute inset-x-0 z-100 pt-safe">
      <View className="h-14 w-full flex-row items-center gap-4 px-2">
        <BlurContainer color="text">
          <IconButton
            icon={OnRTL.decide("arrow-right", "arrow-left")}
            accessibilityLabel={t("form.back")}
            onPress={() => navigation.goBack()}
            color="text"
          />
        </BlurContainer>
        <SearchBar />
      </View>
    </View>
  );
}

function SearchBar() {
  const { t } = useTranslation();
  const [searchEnabled, setSearchEnabled] = useState(false);
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);

  return (
    <View className="relative min-w-10.5 flex-1 items-end">
      <BlurContainer
        color="text"
        className={cn(
          "h-10.5 max-w-[min(512px,100%)] min-w-10.5",
          searchEnabled && "w-full pr-10 pl-2",
        )}
      >
        {searchEnabled ? (
          <TextInput
            autoFocus
            placeholder={t("feat.search.extra.searchMedia")}
            value={query}
            onChangeText={setQuery}
            className="size-full"
          />
        ) : null}
      </BlurContainer>
      <IconButton
        icon={searchEnabled ? "close" : "search"}
        accessibilityLabel={t(
          searchEnabled ? "form.close" : "feat.search.title",
        )}
        onPress={() => {
          setSearchEnabled((prev) => !prev);
          if (searchEnabled) setQuery("");
        }}
        className="absolute top-px right-px"
      />
    </View>
  );
}
//#endregion

//#region Header
function ScreenHeader(props: {
  name: string;
  artwork: string | null;
  metadata: string;
  duration: number;
}) {
  const { t } = useTranslation();
  const dimensions = useWindowDimensions();
  const { text } = useTheme();
  const source = usePlayFromSource();

  const headerHeight = Math.min(400, dimensions.height, dimensions.width);

  return (
    <View
      style={{ height: headerHeight }}
      //? We should be conditionally switching between `-mx-4` & `-mx-5.5` based
      //? on `numColumns`, but it realistically will be >1 (unless the user has
      //? a really small/weird screen).
      className="relative -mx-5.5 items-center justify-end overflow-hidden"
    >
      <Image
        source={props.artwork}
        contentPosition="top"
        className="absolute inset-0"
      />
      <TransitionGradient
        easing
        style={{ height: headerHeight * 0.6 }}
        className="absolute inset-x-0 bottom-0"
      />
      <View className="w-full p-4">
        <Marquee center>
          <Text bold size="4xl">
            {props.name}
          </Text>
        </Marquee>
        <Marquee center contentContainerClassName="flex-row items-center">
          <Text color="textMuted">{props.metadata}</Text>
          {/* Work around for RTL languages. */}
          <Text color="textMuted">{" • "}</Text>
          <Icon name="time" color="textMuted" size={20} />
          <Text color="textMuted">{` ${Seconds.toReadableTime(props.duration, true)}`}</Text>
        </Marquee>

        <View className="mt-4 flex-row items-center justify-center">
          <IconButton
            accessibilityLabel={t("term.play")}
            icon="play-filled"
            onPress={() => PlaybackControls.playFromList({ source })}
            iconColor="background"
            color="text"
            className="h-14 w-full max-w-36"
            style={{ backgroundColor: text }}
          />
        </View>
      </View>
    </View>
  );
}
//#endregion

//#region Tab Bar
function ScreenTabBar(props: TabBarProps) {
  const prevTabIndex = useRef(0);
  const tabListRef = useFlatListRef();

  //? Scrolls to active index when tab changes.
  if (props.index !== prevTabIndex.current) {
    prevTabIndex.current = props.index;
    tabListRef.current?.scrollToIndex({
      index: props.index,
      viewPosition: 0.5,
    });
  }

  return (
    <FlatList
      ref={tabListRef}
      horizontal
      data={props.routes}
      keyExtractor={({ key }) => key}
      renderItem={({ item: { title }, index }) => (
        <Pressable
          onPress={() => props.onIndexChange(index)}
          className={cn(
            "min-w-12",
            index === props.routes.length - 1 && "pr-24",
          )}
        >
          <Text
            bold
            center
            size="xl"
            color={props.index === index ? "text" : "textMuted"}
          >
            {title}
          </Text>
        </Pressable>
      )}
      contentContainerClassName="items-center gap-6 p-4"
    />
  );
}
//#endregion

//#region Top Tracks Tab
function TopTracksTab({ topTracks }: Pick<ScreenData, "topTracks">) {
  const source = usePlayFromSource();
  const bottomOffset = useBottomActionsOffset();
  const trackColCnt = useLayoutColumn("list").count;

  const filteredTracks = useSearchStore(
    useShallow((s) => containSorter(topTracks, s.query, ["name", "album"])),
  );

  return (
    <TabLegendList
      numColumns={trackColCnt}
      data={filteredTracks}
      keyExtractor={({ id }) => id}
      renderItem={({ item }) => (
        <ImageListItem
          artwork={item.artwork}
          label={item.name}
          supporting={item.album ?? "—"}
          onPress={() =>
            PlaybackControls.playFromList({ source, trackId: item.id })
          }
        />
      )}
      ListEmptyComponent={
        <View className="p-8">
          <TText textKey="err.msg.noResults" center />
        </View>
      }
      contentContainerClassName="gap-1.5 px-4"
      contentContainerStyle={{ paddingBottom: bottomOffset, paddingTop: 12 }}
    />
  );
}
//#endregion

//#region Discography Tab
function DiscographyTab({
  discography,
  related,
}: Pick<ScreenData, "discography" | "related">) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const source = usePlayFromSource();

  const renderAlbum = useMemo(
    () => renderAlbumFactory(navigation),
    [navigation],
  );
  const renderTrack = useMemo(() => renderTrackFactory(source), [source]);

  const filteredAlbums = useSearchStore(
    useShallow((s) =>
      containSorter(discography.albums, s.query, ["name", "year"]),
    ),
  );

  const filteredEPs = useSearchStore(
    useShallow((s) =>
      containSorter(discography.eps, s.query, ["name", "year"]),
    ),
  );

  const filteredSingles = useSearchStore(
    useShallow((s) =>
      containSorter(discography.singles, s.query, ["name", "album"]),
    ),
  );

  return (
    <SceneTab>
      {renderLabel(t("term.albums"), filteredAlbums)}
      {filteredAlbums.map(renderAlbum)}

      {renderLabel(t("term.eps"), filteredEPs)}
      {filteredEPs.map(renderAlbum)}

      {renderLabel(t("term.singles"), filteredSingles)}
      {filteredSingles.map(renderTrack)}

      {related.albums.length > 0 || related.genres.length > 0 ? (
        <Divider className="mt-4" />
      ) : null}

      {renderLabel(t("term.appearsIn"), related.albums)}
      {related.albums.map(renderAlbum)}

      {related.genres.length > 0 ? (
        <View className="mt-4 flex-row flex-wrap gap-1.5">
          {related.genres.map((genre) => (
            <ChipButton
              key={genre}
              label={genre}
              onPress={() => navigation.navigate("Genre", { id: genre })}
            />
          ))}
        </View>
      ) : null}
    </SceneTab>
  );
}
//#endregion

//#region Helpers
const TabLegendList = createTabList(LegendList) as LegendListSignature;

/** Generic tab layout for rendering albums, tracks, and other content lazily. */
function SceneTab(props: { children: React.ReactNode }) {
  const bottomOffset = useBottomActionsOffset();

  const albumColCnt = useLayoutColumn("grid").count;
  const trackColCnt = useLayoutColumn("list").count;
  const totalColumns = trackColCnt * albumColCnt;

  return (
    <TabLegendList
      numColumns={totalColumns}
      getItemType={(item: React.JSX.Element) => {
        if (item?.type === Label) return "label";
        if (item?.type === ImageCard) return "album-item";
        else if (item?.type === ImageListItem) return "track-item";
      }}
      overrideItemLayout={(layout, item: React.JSX.Element) => {
        if (item?.type === ImageCard) layout.span = trackColCnt;
        else if (item?.type === ImageListItem) layout.span = albumColCnt;
        else if (item) layout.span = totalColumns;
      }}
      ListEmptyComponent={
        <View className="p-8">
          <TText textKey="err.msg.noResults" center />
        </View>
      }
      contentContainerClassName="gap-1.5 px-4"
      contentContainerStyle={{ paddingBottom: bottomOffset }}
    >
      {props.children}
    </TabLegendList>
  );
}

function Label({ label }: { label: string }) {
  return (
    <Marquee wrapperClassName="pt-1.5">
      <Text bold size="xl">
        {label}
      </Text>
    </Marquee>
  );
}

function renderLabel(label: string, data: readonly unknown[]) {
  if (data.length === 0) return null;
  return <Label label={label} />;
}

function renderAlbumFactory(navigation: GenericNavigation<RootParamList>) {
  return function RenderedAlbum(item: MediaItem.DisplayAlbum) {
    return (
      <ImageCard
        key={`album-${item.id}`}
        artwork={item.artwork}
        label={item.name}
        supporting={item.year}
        onPress={() => navigation.navigate("Album", { id: item.id })}
      />
    );
  };
}

function renderTrackFactory(source: PlayFromSource) {
  return function RenderedTrack(item: MediaItem.DisplayTrack) {
    return (
      <ImageListItem
        key={`track-${item.id}`}
        artwork={item.artwork}
        label={item.name}
        supporting={item.album ?? "—"}
        onPress={() =>
          PlaybackControls.playFromList({ source, trackId: item.id })
        }
      />
    );
  };
}
//#endregion
