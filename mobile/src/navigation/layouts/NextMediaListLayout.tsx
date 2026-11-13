// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

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
import { View, useWindowDimensions } from "react-native";
import type {
  CollapsibleTabViewProps,
  TabBarProps,
} from "react-native-collapsible-tabs-native";
import {
  CollapsibleTabView as RawCollapsibleTabView,
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
import { useShallow } from "zustand/react/shallow";

import { PlaybackControls } from "~/stores/Playback/actions";
import type { PlayFromSource } from "~/stores/Playback/types";
import {
  useGridLayoutConfig,
  useListLayoutConfig,
} from "~/hooks/useLayoutConfigs";

import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";
import { CurrentListMenu } from "~/navigation/components/CurrentListMenu";

import { OnRTL } from "~/lib/react";
import { cn } from "~/lib/style";
import { withAlpha } from "~/utils/color";
import { Seconds } from "~/utils/date";
import { isString } from "~/utils/validation";
import { FlatList, useFlatListRef } from "~/components/Base/List";
import type {
  LegendListProps,
  LegendListSignature,
  ListRenderItemInfo,
} from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import { IconButton } from "~/components/next/base/button-icon";
import { BlurIconButton } from "~/components/next/base/blur-button-icon";
import { Icon } from "~/components/next/base/icon";
import { TextInput } from "~/components/next/base/input";
import type { SheetRef } from "~/components/next/base/sheet";
import { useSheetRef } from "~/components/next/base/sheet";
import { Marquee } from "~/components/next/blocks/marquee";
import type { MediaImageSrc } from "~/components/next/blocks/media-image";
import { TrackListContext } from "~/components/next/composed/track-item";
import { Image } from "~/components/next/primitive/image";
import { Pressable } from "~/components/next/primitive/pressable";
import { Ripple } from "~/components/next/themed/ripple";
import { Text, TText } from "~/components/next/themed/typography";
import {
  ThemeProvider,
  useTheme,
  useTintedDominantColor,
} from "~/modules/customization/theme/core/context";
import { Search, useSearchStore } from "~/modules/search/components/SearchList";
import { containSorter } from "~/modules/search/utils";

const HeaderProgressContext = createContext<SharedValue<number>>(null as never);

const TabLegendList = createTabList(LegendList) as LegendListSignature;

//#region Provider
export function Provider(props: {
  identity: PlayFromSource;
  imageSource: MediaImageSrc;
  children: React.ReactNode;
}) {
  const headerProgress = useSharedValue(0);
  const surfaceColor = useTintedDominantColor(props.imageSource);

  const SubtreeTheme = useMemo(
    () =>
      ({
        primary: "#FFFFFF", //? Used for active track indicator.
        ...(surfaceColor ? { surface: surfaceColor } : {}),
        surfaceContainerHigh: "#C8C8C8", //? Used for `MediaImage` background color.
        onSurface: "#FFFFFF",
        onSurfaceVariant: withAlpha("#FFF", 0.8),
      }) as const,
    [surfaceColor],
  );

  return (
    <TrackListContext value={props.identity}>
      <Search.Provider>
        <HeaderProgressContext value={headerProgress}>
          <ThemeProvider theme={SubtreeTheme}>
            <View style={{ backgroundColor: surfaceColor }} className="grow">
              {props.children}
            </View>
          </ThemeProvider>
        </HeaderProgressContext>
      </Search.Provider>
    </TrackListContext>
  );
}
//#endregion

//#region Top App Bar
export function TopAppBar(props: {
  ArtworkSheet: (props: { id: string; ref: SheetRef }) => React.JSX.Element;
  name: string;
  trackIds: string[];
}) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const sheetRef = useSheetRef();

  return (
    <>
      <props.ArtworkSheet ref={sheetRef} id={use(TrackListContext).id} />
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

//#region TabView
/** `CollapsibleTabView` which has the necessary logic pre-applied. */
export function CollapsibleTabView<TData extends string>(
  props: Omit<
    CollapsibleTabViewProps<{ key: TData; title: string }>,
    | "headerMinHeight"
    | "navigationState"
    | "onIndexChange"
    | "onHeaderOffsetChange"
  > & { routes: Array<{ key: TData; title: string }> },
) {
  const insets = useSafeAreaInsets();
  const [tabIndex, setTabIndex] = useState(0);
  const headerProgress = use(HeaderProgressContext);

  return (
    <RawCollapsibleTabView
      {...props}
      headerMinHeight={56 + insets.top}
      navigationState={{ index: tabIndex, routes: props.routes }}
      onIndexChange={setTabIndex}
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
export function Header(props: {
  name: string;
  imageSource: MediaImageSrc;
  metadata: string[];
  totalDuration: number;
}) {
  const { width, height } = useWindowDimensions();
  const { surface, onSurface } = useTheme();
  const trackSource = use(TrackListContext);
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
            {props.metadata.join(" • ")}
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

//#region Tab Bar
/** Tab bar rendered by `CollapsibleTabView`. */
export function TabBar(props: TabBarProps) {
  const { surface } = useTheme();
  const prevTabIndex = useRef(0);
  const tabListRef = useFlatListRef();

  //? Scrolls to active tab when changed.
  if (props.index !== prevTabIndex.current) {
    prevTabIndex.current = props.index;
    tabListRef.current?.scrollToIndex({
      index: props.index,
      viewPosition: 0.5,
    });
  }

  return (
    <View
      style={{ backgroundColor: surface }}
      className="flex-row items-center"
    >
      <SearchBar />
      <Animated.View layout={LinearTransition} className="shrink grow">
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
                size="lg"
                color={props.index === index ? "onSurface" : "onSurfaceVariant"}
              >
                {title}
              </Text>
            </Pressable>
          )}
          contentContainerClassName="items-center gap-6 pr-4"
        />
      </Animated.View>
    </View>
  );
}
//#endregion

//#region Search Bar
/** Allows filtering the data rendered by `DataList`. */
export function SearchBar() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const { onSurface } = useTheme();
  const [searchEnabled, setSearchEnabled] = useState(false);
  const query = useSearchStore((s) => s.query);
  const setQuery = useSearchStore((s) => s.setQuery);

  return (
    <Animated.View
      layout={LinearTransition}
      style={{ maxWidth: Math.min(512, width) }}
      className="mx-0.75 max-w-[min(512px,100%)] flex-row items-center gap-2 overflow-hidden pr-4 pl-1"
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
          className="h-10 min-h-0 shrink grow border-b-2"
        />
      ) : null}
    </Animated.View>
  );
}
//#endregion

//#region Data List
type RequiredDataFields = { id: string; name: string };

export type RenderDataListItem<TData extends RequiredDataFields> = (
  info: ListRenderItemInfo<TData> & { itemWidth: number },
) => React.ReactElement;

/** Prepared `LegendList` to render data. */
export function DataList<TData extends RequiredDataFields>({
  asTab = true,
  asGrid = false,
  label,
  data = [],
  renderItem: _renderItem,
  ...props
}: Omit<
  LegendListProps<TData>,
  "keyExtractor" | "renderItem" | "ListHeaderComponent" | "ListEmptyComponent"
> & {
  CustomLegendList?: LegendListSignature;
  /** If this is used as a "tab" instead of a regular list. */
  asTab?: boolean;
  asGrid?: boolean;
  /** Renders a "label" on top of the list via `ListHeaderComponent`. */
  label?: string;
  renderItem: RenderDataListItem<TData>;
}) {
  const CustomLegendList = asTab ? TabLegendList : LegendList;
  const layout = (asGrid ? useGridLayoutConfig : useListLayoutConfig)();
  const bottomOffset = useBottomActionsOffset();
  const filteredData = useSearchStore(
    useShallow((s) =>
      // @ts-expect-error - The `name` field is guaranteed to exist.
      data ? containSorter(data, s.query, "name") : undefined,
    ),
  );

  const renderItem = useCallback(
    (info: ListRenderItemInfo<TData>) =>
      _renderItem({ ...info, itemWidth: layout.width }),
    [_renderItem, layout.width],
  );

  if (!asTab && (!filteredData || filteredData.length === 0)) return null;
  return (
    <CustomLegendList
      numColumns={layout.count}
      estimatedItemSize={(asGrid ? layout.width : 56) + 6}
      {...props}
      data={filteredData}
      keyExtractor={({ id }) => id}
      renderItem={renderItem}
      ListHeaderComponent={
        label ? (
          <Text bold size="sm">
            {label}
          </Text>
        ) : null
      }
      ListEmptyComponent={
        <View className="px-4 py-12">
          <TText textKey="err.msg.noResults" center />
        </View>
      }
      className={cn("-mx-0.75", props.className)}
      contentContainerStyle={[
        { paddingBottom: bottomOffset, paddingTop: 16 },
        props.contentContainerStyle,
      ]}
      contentContainerClassName={cn(
        "gap-y-1.5 p-4",
        props.contentContainerClassName,
      )}
    />
  );
}
//#endregion
