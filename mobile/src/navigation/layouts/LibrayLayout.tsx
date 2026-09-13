// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { ParseKeys } from "i18next";
import { useTranslation } from "react-i18next";
import { View } from "react-native";

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
import { TText } from "~/components/next/base/typography";
import {
  getLargeImageCardHeight,
  ImageCard,
  LargeImageCard,
} from "~/components/next/composed/image-card";
import { ImageListItem } from "~/components/next/composed/image-list-item";

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
  const sheetRef = useSheetRef();

  return (
    <>
      <props.OptionsSheet ref={sheetRef} />
      <View className="px-4 pt-safe-offset-8 pb-2">
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
  /** If the non-favorite media are rendered as a grid. */
  withGrid?: boolean;
}) {
  const gridLayout = useGridLayoutConfig();
  const compactGridLayout = useCompactGridLayoutConfig();
  const config = props.withGrid ? gridLayout : compactGridLayout;

  const estimatedItemSize = props.withGrid
    ? getLargeImageCardHeight(config.width)
    : config.width;
  const Wrapper = props.withGrid ? LargeImageCard : ImageCard;

  if (props.data.length === 0) return undefined;
  return (
    <LegendList
      numColumns={config.count}
      data={props.data}
      estimatedItemSize={estimatedItemSize + 4}
      renderItem={({ item }) => (
        <Wrapper
          src={
            Array.isArray(item.imageSource)
              ? item.imageSource[0]
              : item.imageSource
          }
          size={config.width}
          label={item.title}
          supporting={item.description}
          onPress={() => props.onPress(item.id)}
          className="mx-0.5 mb-1"
        />
      )}
      scrollEnabled={false}
      className="-mx-0.5 -mb-1"
      contentContainerClassName="pb-4"
    />
  );
}
//#endregion

//#region Media List
export function MediaList(props: {
  data: LayoutItem[];
  onPress: (id: string) => void;
  asGrid?: boolean;
  ListHeaderComponent?: React.JSX.Element;
  ListEmptyComponent?: React.JSX.Element;
}) {
  const listLayout = useListLayoutConfig();
  const compactGridLayout = useCompactGridLayoutConfig();
  const config = props.asGrid ? compactGridLayout : listLayout;

  const Wrapper = props.asGrid ? ImageCard : ImageListItem;

  const showNavbar = usePreferenceStore((s) => s.showNavbar);
  const bottomOffset = useBottomActionsOffset({
    maxRows: showNavbar ? 2 : 1,
    rowAlwaysVisible: true,
  });

  return (
    <LegendList
      numColumns={config.count}
      data={props.data}
      estimatedItemSize={config.width + 4}
      renderItem={({ item }) => (
        <Wrapper
          src={
            Array.isArray(item.imageSource)
              ? item.imageSource[0]
              : item.imageSource
          }
          size={config.width}
          label={item.title}
          supporting={!props.asGrid ? item.description : undefined}
          onPress={() => props.onPress(item.id)}
          className={cn("mx-0.5 mb-1", !props.asGrid && "pr-4")}
        />
      )}
      ListHeaderComponent={props.ListHeaderComponent}
      ListEmptyComponent={props.ListEmptyComponent}
      className="-mx-0.5 -mb-1"
      contentContainerStyle={{ paddingBottom: bottomOffset }}
      contentContainerClassName="p-4"
    />
  );
}
//#endregion
