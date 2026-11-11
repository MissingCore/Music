// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useNavigation } from "@react-navigation/native";
import type { LinearGradientProps } from "expo-linear-gradient";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useWindowDimensions, View } from "react-native";
import type { TabBarProps } from "react-native-collapsible-tabs-native";
import {
  CollapsibleTabView,
  createTabList,
} from "react-native-collapsible-tabs-native";
import { easeGradient } from "react-native-easing-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { MediaDetails } from "~/adapters/types";
import { useArtistDetails } from "~/data/artist/queries";
import {
  useCompactGridLayoutConfig,
  useListLayoutConfig,
} from "~/hooks/useLayoutConfigs";

import { useBottomActionsOffset } from "~/navigation/components/BottomActions/useBottomActions";

import { getImageUri } from "~/lib/file-system";
import { OnRTL } from "~/lib/react";
import type { ExtractQueryData } from "~/lib/react-query";
import { cn } from "~/lib/style";
import { Seconds } from "~/utils/date";
import { isString } from "~/utils/validation";
import type { LegendListSignature } from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import { ScrollView } from "~/components/Base/ScrollView";
import { BlurIconButton } from "~/components/next/base/blur-button-icon";
import { Icon } from "~/components/next/base/icon";
import { Ripple } from "~/components/next/base/ripple";
import { Text, TText } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";
import { ImageCard } from "~/components/next/composed/image-card";
import {
  TrackItem,
  TrackListContext,
} from "~/components/next/composed/track-item";
import { Image } from "~/components/next/primitive/image";
import { Pressable } from "~/components/Base/Pressable";
import type { HexColor } from "~/modules/customization/theme/core/constants";
import { useTintedDominantColor } from "~/modules/customization/theme/hooks";

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

  const trackSource = useMemo(
    () => ({ type: "artist", id: artistName }) as const,
    [artistName],
  );

  if (isPending || error) return null;
  return (
    <View style={{ backgroundColor: mainColor }} className="grow">
      <TopAppBar />
      <TrackListContext value={trackSource}>
        <ScreenContents data={data} mainColor={mainColor} />
      </TrackListContext>
    </View>
  );
}

//#region Top App Bar
function TopAppBar() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0 top-0 z-50 flex-row items-center justify-between p-2 pt-safe-offset-2"
    >
      <BlurIconButton
        icon={OnRTL.decide("east", "west")}
        accessibilityLabel={t("form.back")}
        onPress={() => navigation.goBack()}
      />
    </View>
  );
}
//#endregion

//#region Screen Contents
type AvailableRoutes = "topTracks" | "albums" | "eps" | "singles";

function ScreenContents({
  data,
  mainColor,
}: {
  data: ArtistDetail;
  mainColor: HexColor;
}) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [tabIndex, setTabIndex] = useState(0);

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
      renderHeader={() => <ScreenHeader {...data} mainColor={mainColor} />}
      renderTabBar={(args) => (
        <RenderedTabBar {...args} mainColor={mainColor} />
      )}
      renderScene={({ route }) => (
        // @ts-expect-error - `asGrid` is `true | false`.
        <RenderedList
          asGrid={route.key === "albums" || route.key === "eps"}
          data={data[route.key]!}
        />
      )}
    />
  );
}
//#endregion

//#region Header
function ScreenHeader(
  props: Pick<
    ArtistDetail,
    "name" | "imageSource" | "numTracks" | "totalDuration"
  > & { mainColor: HexColor },
) {
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const headerHeight = Math.min(400, width, height);

  const { colors, locations } = useMemo(
    () =>
      easeGradient({
        colorStops: {
          0: { color: `${props.mainColor}00` },
          1: { color: props.mainColor },
        },
      }) as unknown as Pick<LinearGradientProps, "colors" | "locations">,
    [props.mainColor],
  );

  return (
    <View
      style={{ height: headerHeight }}
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

      <View className="w-full p-4">
        <Marquee center>
          <Text bold size="4xl" className="text-white">
            {props.name}
          </Text>
        </Marquee>
        <Marquee
          center
          contentContainerClassName="mt-2 mb-4 flex-row items-center"
        >
          <Text size="sm" className="text-white/80">
            {t("plural.track", { count: props.numTracks })}
          </Text>
          {/* Work around for RTL languages. */}
          <Text size="sm" className="text-white/80">
            {" • "}
          </Text>
          <Icon name="schedule" size={16} color="#FFFFFFCC" />
          <Text size="sm" className="text-white/80">
            {` ${Seconds.toReadableTime(props.totalDuration, true)}`}
          </Text>
        </Marquee>
        <Ripple
          onPress={() => console.log("Playing from artist list...")}
          rippleColor="#C8C8C8"
          className="min-h-12 min-w-32 flex-row items-center justify-center gap-1 self-center rounded-full bg-white p-2"
        >
          <Icon name="play-arrow-filled" size={32} color={props.mainColor} />
          <TText
            textKey="term.play"
            bold
            size="lg"
            style={{ color: props.mainColor }}
          />
        </Ripple>
      </View>
    </View>
  );
}
//#endregion

//#region Rendered Tab Bar
function RenderedTabBar(props: TabBarProps & { mainColor: HexColor }) {
  return (
    <ScrollView
      horizontal
      style={{ backgroundColor: props.mainColor }}
      contentContainerClassName="gap-6 p-4"
    >
      {props.routes.map(({ key, title }, index) => (
        <Pressable
          key={key}
          onPress={() => props.onIndexChange(index)}
          className={cn(
            "min-w-12",
            props.index === index && "border-b-2 border-white",
          )}
        >
          <Text
            bold
            center
            size="lg"
            className={cn(
              props.index === index ? "text-white" : "text-white/80",
            )}
          >
            {title}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
//#endregion

//#region Rendered Lists
type RenderedListProps =
  | { asGrid: true; data: MediaDetails.DisplayAlbum[] }
  | { asGrid?: false; data: MediaDetails.DisplayTrack[] };

function RenderedList(props: RenderedListProps) {
  const navigation = useNavigation();
  const layout = (
    props.asGrid ? useCompactGridLayoutConfig : useListLayoutConfig
  )();
  const bottomOffset = useBottomActionsOffset();

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
      data={props.data}
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
