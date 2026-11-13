// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import { createContext, use, useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { CollapsibleTabView } from "react-native-collapsible-tabs-native";
import type { SharedValue } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { MediaDetails } from "~/adapters/types";
import { useArtistDetails } from "~/data/artist/queries";

import * as MediaListLayout from "~/navigation/layouts/NextMediaListLayout";
import { ArtistArtworkSheet } from "~/navigation/sheets/ArtworkSheet";
import { CurrentListMenu } from "~/navigation/components/CurrentListMenu";

import { getImageUri } from "~/lib/file-system";
import { OnRTL } from "~/lib/react";
import type { ExtractQueryData } from "~/lib/react-query";
import { BlurIconButton } from "~/components/next/base/blur-button-icon";
import { useSheetRef } from "~/components/next/base/sheet";
import { ImageCard } from "~/components/next/composed/image-card";
import { TrackItem } from "~/components/next/composed/track-item";

const HeaderProgressContext = createContext<SharedValue<number>>(null as never);

type ArtistDetail = ExtractQueryData<typeof useArtistDetails>;

type Props = StaticScreenProps<{ id: string }>;

export default function Artist({
  route: {
    params: { id: artistName },
  },
}: Props) {
  const { isPending, error, data } = useArtistDetails(artistName);

  if (isPending || error) return null;
  return (
    <MediaListLayout.Provider
      identity={{ type: "artist", id: artistName }}
      imageSource={data.imageSource}
    >
      <TopAppBar
        id={artistName}
        name={data.name}
        trackIds={(data.topTracks ?? []).map(({ id }) => id)}
      />
      <ScreenContents data={data} />
    </MediaListLayout.Provider>
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
      renderHeader={() => <MediaListLayout.Header {...data} />}
      renderTabBar={MediaListLayout.TabBar}
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

//#region Rendered Lists
type RenderedListProps =
  | { asGrid: true; data: MediaDetails.DisplayAlbum[] }
  | { asGrid?: false; data: MediaDetails.DisplayTrack[] };

function RenderedList(props: RenderedListProps) {
  const navigation = useNavigation();

  const renderAlbum = useCallback<
    MediaListLayout.RenderDataListItem<MediaDetails.DisplayAlbum>
  >(
    ({ item, itemWidth }) => (
      <ImageCard
        src={item.artwork}
        size={itemWidth}
        label={item.name}
        supporting={item.year}
        onPress={() =>
          navigation.navigate("Album", { id: item.id }, { pop: true })
        }
      />
    ),
    [navigation],
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
    <MediaListLayout.DataList
      asGrid={props.asGrid}
      // @ts-expect-error - Data is compatible.
      data={props.data}
      // @ts-expect-error - Data will render the item correctly.
      renderItem={props.asGrid ? renderAlbum : renderTrack}
    />
  );
}
//#endregion
