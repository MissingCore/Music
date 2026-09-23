// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import {
  createContext,
  use,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { ScrollHandler, SharedValue } from "react-native-reanimated";
import Animated, {
  clamp,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { scheduleOnUI } from "react-native-worklets";

import { usePreferenceStore } from "~/stores/Preference/store";
import type { LayoutItem } from "~/stores/ViewPreference/types";
import {
  useCompactGridLayoutConfig,
  useGridLayoutConfig,
  useListLayoutConfig,
} from "~/hooks/useLayoutConfigs";

import { useBottomActionsOffset } from "../components/BottomActions/useBottomActions";

import { cn } from "~/lib/style";
import type {
  AnimatedLegendListRef,
  LegendListProps,
  ListRenderItemInfo,
} from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import { TopDownGradient } from "~/components/Gradient";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import {
  ScrollContextProvider,
  useScrollContext,
} from "~/components/next/base/scroll-context";
import { TText } from "~/components/next/base/typography";
import { IconButton } from "~/components/next/blocks/icon-button";
import { Marquee } from "~/components/next/blocks/marquee";
import { Scrollbar } from "~/components/next/blocks/scrollbar";
import {
  getLargeImageCardHeight,
  ImageCard,
  LargeImageCard,
} from "~/components/next/composed/image-card";
import { ImageListItem } from "~/components/next/composed/image-list-item";

//#region Provider
interface LibraryLayoutInput {
  asGrid: boolean;
  ref?: AnimatedLegendListRef;
}

interface LibraryLayoutValue extends LibraryLayoutInput {
  headerHeight: number;
  setHeaderHeight: (height: number) => void;
  headerPosition: SharedValue<number>;
  resetHeaderPosition: VoidFunction;
  bottomOffset: number;
}

const LibraryLayoutContext = createContext<LibraryLayoutValue>(null as never);

export function Provider({
  children,
  ref,
  ...props
}: LibraryLayoutInput & { children: React.ReactNode }) {
  const { top } = useSafeAreaInsets();
  const scrollPosition = useSharedValue(0);

  //#region Shy Header
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerPosition = useSharedValue(0);

  const resetHeaderPosition = useCallback(() => {
    "worklet";
    headerPosition.set(0);
  }, [headerPosition]);

  const direction = useSharedValue(0);
  // Boolean to prevent canceling our spring animation from a slow `onScroll`
  // event called by `scrollTo`.
  const blockEvents = useSharedValue(-1);

  const onScroll = useCallback<ScrollHandler<any>>(
    (e) => {
      "worklet";
      const delta = scrollPosition.get() - e.contentOffset.y;
      direction.set(delta < 0 ? -1 : 0);

      if (blockEvents.get() !== -1) return;
      headerPosition.set(clamp(headerPosition.get() + delta, -headerHeight, 0));
    },
    [scrollPosition, headerHeight, headerPosition, direction, blockEvents],
  );

  //* Header snapping logic.
  const handleScrollEnd = useCallback(() => {
    "worklet";
    if (scrollPosition.get() > headerHeight) {
      blockEvents.set(1);

      const snapToVisible =
        headerPosition.get() >
        -headerHeight * (direction.get() === -1 ? 0.2 : 0.6);

      headerPosition.set(withSpring(snapToVisible ? 0 : -headerHeight));
      blockEvents.set(withTiming(-1, { duration: 50 }));

      direction.set(0);
    }
  }, [scrollPosition, headerHeight, headerPosition, direction, blockEvents]);

  const scrollHandlers = useMemo(
    () => ({ onScroll, onMomentumEnd: handleScrollEnd }),
    [onScroll, handleScrollEnd],
  );
  //#endregion

  const showNavbar = usePreferenceStore((s) => s.showNavbar);
  const bottomOffset = useBottomActionsOffset({
    maxRows: showNavbar ? 2 : 1,
    rowAlwaysVisible: true,
  });

  const contextValue = useMemo(
    () => ({
      ...props,
      headerHeight,
      setHeaderHeight,
      headerPosition,
      resetHeaderPosition,
      bottomOffset,
    }),
    [props, headerHeight, headerPosition, resetHeaderPosition, bottomOffset],
  );

  return (
    <ScrollContextProvider
      ref={ref}
      scrollHandlers={scrollHandlers}
      scrollAmount={scrollPosition}
    >
      <TopDownGradient
        height={headerHeight}
        startFrom={top}
        className="absolute top-0 left-0 z-50"
      />
      <LibraryLayoutContext value={contextValue}>
        {children}
      </LibraryLayoutContext>
      <Scrollbar
        offset={{ top: headerHeight, bottom: bottomOffset }}
        onEnd={handleScrollEnd}
      />
    </ScrollContextProvider>
  );
}
//#endregion

//#region Header
const SHADOW_HEIGHT = 16;

export function Header(props: {
  titleKey: ParseKeys;
  OptionsSheet: (props: { ref: TrueSheetRef }) => React.JSX.Element;
  /** Additional "actions" which will appear before the "Screen Options" button. */
  Actions?: React.ReactNode;
  /** Component rendered after the header but before the shadow. */
  Subheader?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { headerHeight, setHeaderHeight, headerPosition } =
    use(LibraryLayoutContext);
  const sheetRef = useSheetRef();
  const [containerHeight, setContainerHeight] = useState(0);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: headerPosition.get() }],
    opacity: clamp(
      // Start fade after the header is 10% hidden.
      (headerHeight * 1.1 + headerPosition.get()) / (headerHeight ?? 1),
      0,
      1,
    ),
  }));

  return (
    <>
      <props.OptionsSheet ref={sheetRef} />
      <Animated.View
        // Add `16` to signify the gap between the header and the start of the content.
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        style={headerStyle}
        className="absolute top-0 right-0 left-0 z-50"
      >
        <TopDownGradient
          height={headerHeight}
          startFrom={containerHeight}
          className="absolute top-0 left-0"
        />
        <View
          onLayout={(e) => setContainerHeight(e.nativeEvent.layout.height)}
          style={{ marginBottom: SHADOW_HEIGHT }}
          className="gap-2 px-4 pt-safe-offset-8"
        >
          <View className="flex-row items-center justify-between gap-4">
            <Marquee>
              <TText textKey={props.titleKey} intent="accent" size="4xl" />
            </Marquee>
            <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
              {props.Actions}
              <IconButton
                icon="more-horiz"
                accessibilityLabel={t("feat.modalViewPreference.title")}
                onPress={() => sheetRef.current?.present()}
                filled
              />
            </View>
          </View>
          {props.Subheader}
        </View>
      </Animated.View>
    </>
  );
}
//#endregion

//#region Favorite Media
export function FavoriteMedia(props: {
  data: LayoutItem[];
  onPress: (id: string) => void;
}) {
  const { asGrid: withGrid } = use(LibraryLayoutContext);
  const gridLayout = useGridLayoutConfig();
  const compactGridLayout = useCompactGridLayoutConfig();
  const config = withGrid ? gridLayout : compactGridLayout;

  const estimatedItemSize =
    (withGrid ? getLargeImageCardHeight(config.width) : config.width) + 4;

  const rowCount = Math.ceil(props.data.length / config.count);
  const estimatedHeight = rowCount * estimatedItemSize + 16;

  const Wrapper = withGrid ? LargeImageCard : ImageCard;

  if (props.data.length === 0) return undefined;
  return (
    <LegendList
      numColumns={config.count}
      estimatedItemSize={estimatedItemSize}
      data={props.data}
      keyExtractor={({ id }) => id}
      renderItem={({ item }) => (
        <Wrapper
          src={item.imageSource}
          size={config.width}
          label={item.title}
          supporting={item.description}
          onPress={() => props.onPress(item.id)}
          className="mx-0.5 mb-1"
        />
      )}
      scrollEnabled={false}
      className="-mb-1"
      contentContainerStyle={{ minHeight: estimatedHeight }}
      contentContainerClassName="pb-4"
    />
  );
}
//#endregion

//#region Media List
export type MediaListRenderItem<TData> = (
  props: ListRenderItemInfo<TData>,
) => React.ReactNode;

type MediaListProps<TData> = {
  ListHeaderComponent?: React.JSX.Element;
  ListEmptyComponent?: React.JSX.Element;
} & (
  | {
      data: LayoutItem[] | undefined;
      onPress: (id: string) => void;
      keyExtractor?: never;
      renderItemFactory?: never;
    }
  | {
      data: TData[] | undefined;
      onPress?: never;
      keyExtractor: NonNullable<LegendListProps<TData>["keyExtractor"]>;
      /** Forces `list` layout. */
      renderItemFactory: (listItemClass: string) => MediaListRenderItem<TData>;
    }
);

export function MediaList<TData>({
  data,
  onPress,
  keyExtractor: _keyExtractor,
  renderItemFactory,
  ListHeaderComponent,
  ListEmptyComponent,
}: MediaListProps<TData>) {
  const { scrollRef, scrollableHeight, scrollHandlers } = useScrollContext();
  const { asGrid, headerHeight, resetHeaderPosition, bottomOffset } =
    use(LibraryLayoutContext);
  const listLayout = useListLayoutConfig();
  const compactGridLayout = useCompactGridLayoutConfig();
  const config = asGrid && !renderItemFactory ? compactGridLayout : listLayout;
  const prevConfig = useRef({ cols: config.count, width: config.width });

  const keyExtractor = useMemo<LegendListProps<any>["keyExtractor"]>(() => {
    if (renderItemFactory) return _keyExtractor;
    return ({ id }) => id;
  }, [renderItemFactory, _keyExtractor]);

  const renderItem = useMemo<MediaListRenderItem<any>>(() => {
    if (renderItemFactory) return renderItemFactory("mx-0.5 mb-1");
    const Wrapper = asGrid ? ImageCard : ImageListItem;
    return function RenderBasicItem({ item }: { item: LayoutItem }) {
      return (
        <Wrapper
          src={item.imageSource}
          size={config.width}
          label={item.title}
          supporting={!asGrid ? item.description : undefined}
          onPress={() => onPress(item.id)}
          className={cn("mx-0.5 mb-1", !asGrid && "pr-4")}
        />
      );
    };
  }, [onPress, renderItemFactory, asGrid, config.width]);

  const scrollListeners = useAnimatedScrollHandler(scrollHandlers);

  if (
    prevConfig.current.cols !== config.count ||
    prevConfig.current.width !== config.width
  ) {
    prevConfig.current = { cols: config.count, width: config.width };
    scheduleOnUI(resetHeaderPosition);
  }

  if (!headerHeight) return ListEmptyComponent;
  return (
    <LegendList
      ref={scrollRef}
      numColumns={config.count}
      estimatedItemSize={config.width + 4}
      data={data}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      onContentSizeChange={(_, height) => scrollableHeight.set(height)}
      onScroll={scrollListeners}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      className="-mx-0.5 -mb-1"
      contentContainerStyle={{
        paddingTop: headerHeight,
        paddingBottom: bottomOffset,
      }}
      contentContainerClassName="p-4 pt-0"
    />
  );
}
//#endregion
