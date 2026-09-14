// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { createContext, use, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

import { usePreferenceStore } from "~/stores/Preference/store";
import type { LayoutItem } from "~/stores/ViewPreference/types";
import {
  useCompactGridLayoutConfig,
  useGridLayoutConfig,
  useListLayoutConfig,
} from "~/hooks/useLayoutConfigs";

import { useBottomActionsOffset } from "../components/BottomActions/useBottomActions";

import { cn } from "~/lib/style";
import { LegendList } from "~/components/Base/LegendList";
import { FilledIconButton } from "~/components/Form/Button/Icon";
import { Marquee } from "~/components/Marquee";
import type { TrueSheetRef } from "~/components/Sheet/useSheetRef";
import { useSheetRef } from "~/components/Sheet/useSheetRef";
import {
  ScrollContextProvider,
  useScrollContext,
} from "~/components/next/base/scroll-context";
import { TText } from "~/components/next/base/typography";
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
}

interface LibraryLayoutValue extends LibraryLayoutInput {
  headerHeight: number;
  setHeaderHeight: (height: number) => void;
  fullListHeight: SharedValue<number>;
  bottomOffset: number;
}

const LibraryLayoutContext = createContext<LibraryLayoutValue>(null as never);

export function Provider({
  children,
  ...props
}: LibraryLayoutInput & { children: React.ReactNode }) {
  const [headerHeight, setHeaderHeight] = useState(0);
  const fullListHeight = useSharedValue(0);

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
      fullListHeight,
      bottomOffset,
    }),
    [props, headerHeight, fullListHeight, bottomOffset],
  );

  return (
    <ScrollContextProvider>
      <LibraryLayoutContext value={contextValue}>
        {children}
      </LibraryLayoutContext>
      <Scrollbar
        fullListHeight={fullListHeight}
        offset={{ top: headerHeight, bottom: bottomOffset }}
      />
    </ScrollContextProvider>
  );
}
//#endregion

//#region Header
export function Header(props: {
  titleKey: ParseKeys;
  OptionsSheet: (props: { ref: TrueSheetRef }) => React.JSX.Element;
  /** Additional "actions" which will appear before the "Screen Options" button. */
  Actions?: React.ReactNode;
  /** Component rendered after the header but before the shadow. */
  Subheader?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const { setHeaderHeight } = use(LibraryLayoutContext);
  const sheetRef = useSheetRef();

  return (
    <>
      <props.OptionsSheet ref={sheetRef} />
      <View
        // Add `16` to signify the gap between the header and the start of the content.
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height + 16)}
        className="absolute top-0 right-0 left-0 z-50 bg-surface px-4 pt-safe-offset-8 pb-2"
      >
        <View className="flex-row items-center justify-between gap-4">
          <Marquee>
            <TText textKey={props.titleKey} intent="accent" size="4xl" />
          </Marquee>
          <View className="flex-row items-center gap-1 rounded-full bg-surfaceContainerLowest">
            {props.Actions}
            <FilledIconButton
              icon="more-horiz"
              accessibilityLabel={t("feat.modalViewPreference.title")}
              onPress={() => sheetRef.current?.present()}
            />
          </View>
        </View>
        {props.Subheader}
      </View>
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
      data={props.data}
      estimatedItemSize={estimatedItemSize}
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
      className="-mx-0.5 -mb-1"
      contentContainerStyle={{ minHeight: estimatedHeight }}
      contentContainerClassName="pb-4"
    />
  );
}
//#endregion

//#region Media List
export function MediaList(props: {
  data: LayoutItem[];
  onPress: (id: string) => void;
  ListHeaderComponent?: React.JSX.Element;
  ListEmptyComponent?: React.JSX.Element;
}) {
  const { scrollRef, ...scrollHandlers } = useScrollContext();
  const { asGrid, fullListHeight, headerHeight, bottomOffset } =
    use(LibraryLayoutContext);
  const listLayout = useListLayoutConfig();
  const compactGridLayout = useCompactGridLayoutConfig();
  const config = asGrid ? compactGridLayout : listLayout;

  const Wrapper = asGrid ? ImageCard : ImageListItem;

  const onScroll = useAnimatedScrollHandler({
    onScroll: scrollHandlers.onScroll,
  });

  return (
    <LegendList
      ref={scrollRef}
      numColumns={config.count}
      data={props.data}
      estimatedItemSize={config.width + 4}
      renderItem={({ item }) => (
        <Wrapper
          src={item.imageSource}
          size={config.width}
          label={item.title}
          supporting={!asGrid ? item.description : undefined}
          onPress={() => props.onPress(item.id)}
          className={cn("mx-0.5 mb-1", !asGrid && "pr-4")}
        />
      )}
      onContentSizeChange={(_, height) => fullListHeight.set(height)}
      onScroll={onScroll}
      ListHeaderComponent={props.ListHeaderComponent}
      ListEmptyComponent={props.ListEmptyComponent}
      className="-mx-0.5 -mb-1"
      contentContainerStyle={{
        paddingTop: headerHeight,
        paddingBottom: bottomOffset,
      }}
      contentContainerClassName="p-4"
    />
  );
}
//#endregion
