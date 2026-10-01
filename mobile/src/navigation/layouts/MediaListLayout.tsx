// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import React, { use, useCallback, useMemo } from "react";
import { useWindowDimensions, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useInForeground } from "~/stores/ListenerState";
import { usePlaybackStore } from "~/stores/Playback/store";
import type { PlayFromSource } from "~/stores/Playback/types";
import { arePlaybackSourceEqual } from "~/stores/Playback/utils";
import {
  TABLET_SIDEBAR_WIDTH_RATIO,
  useAlternativeLayout,
} from "~/hooks/useAlternativeLayout";
import { useDelayedReady } from "~/hooks/useDelayedReady";

import { useBottomActionsOffset } from "../components/BottomActions/useBottomActions";
import { ContentPlaceholder, PagePlaceholder } from "../components/Placeholder";
import { BackButton, TopAppBarTemplate } from "../components/TopAppBar";

import { clamp } from "~/utils/number";
import type { LegendListProps } from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import { Icon } from "~/components/next/base/icon";
import { Text } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";
import type { MediaImageSrc } from "~/components/next/composed/media-image";
import { MediaImage } from "~/components/next/composed/media-image";
import { TrackListContext } from "~/components/next/composed/track-item";
import { AtmosphereBackground } from "~/modules/customization/atmosphere/AtmosphereBackground";
import { ArtistsLink } from "~/modules/media/components/ArtistsLink";
import { MediaListControls } from "~/modules/media/components/MediaListControls";
import { Vinyl } from "~/modules/media/components/Vinyl";

//#region Top App Bar
function TopAppBar() {
  return (
    <View className="absolute inset-x-0 top-safe z-10">
      <TopAppBarTemplate headerLeftAction={<BackButton />} />
    </View>
  );
}
//#endregion

//#region Skeleton
export function Skeleton({ pending = false }) {
  return (
    <View className="flex-1 pt-safe-offset-14">
      <TopAppBar />
      <PagePlaceholder isPending={pending} />
    </View>
  );
}
//#endregion

//#region Provider
export function Provider(props: {
  imageSource: MediaImageSrc;
  listSource: PlayFromSource;
  children: React.ReactNode;
}) {
  return (
    <TrackListContext value={props.listSource}>
      <AtmosphereBackground source={props.imageSource}>
        <TopAppBar />
        <Layout>{props.children}</Layout>
      </AtmosphereBackground>
    </TrackListContext>
  );
}
//#endregion

//#region Layout
function Layout(props: { children: React.ReactNode }) {
  const bottomOffset = useBottomActionsOffset();

  //? Keep defined nodes.
  const childNodes: React.JSX.Element[] = useMemo(
    () =>
      (Array.isArray(props.children)
        ? props.children
        : // `flat(1)` is to handle fragments.
          React.Children.toArray(props.children).flat(1)
      ).filter((node) => node),
    [props.children],
  );

  const stickyIndex = childNodes.findIndex((n) => n.type.name === "Controls");

  if (stickyIndex === -1)
    throw new Error("`<MediaListLayout.Controls />` is missing.");
  if (childNodes.findIndex((n) => n.type.name === "List") === -1)
    throw new Error("`<MediaListLayout.List />` is missing.");

  const lazyElements = useMemo(() => {
    const arr = childNodes.slice(0, -1);
    arr.splice(
      stickyIndex + 1,
      0,
      <View key="controls-spacer" className="h-6 w-full" />,
    );
    return arr;
  }, [childNodes, stickyIndex]);
  const lazyElementsCount = lazyElements.length - 1;

  const { data, keyExtractor, renderItem, ...rest } = childNodes.at(-1)!
    .props as ListProps<any>;

  const mergedData = useMemo(() => {
    const arr = [...lazyElements, ...(data ?? [])];
    if (!data || data.length === 0)
      arr.push(<ContentPlaceholder errMsgKey="err.msg.noTracks" />);
    return arr;
  }, [lazyElements, data]);

  const mergedKeyExtractor = useCallback<ListProps<any>["keyExtractor"]>(
    (item, index) =>
      item?.$$typeof
        ? `REACT_NODE-${(item as React.JSX.Element).type.name}`
        : keyExtractor?.(item, index - lazyElementsCount),
    [lazyElementsCount, keyExtractor],
  );

  const mergedRenderItem = useCallback<ListProps<any>["renderItem"]>(
    (args) =>
      args.item?.$$typeof
        ? args.item
        : renderItem?.({ ...args, index: args.index - lazyElementsCount }),
    [lazyElementsCount, renderItem],
  );

  return (
    <LegendList
      {...rest}
      //! FIXME: "Hack" to prevent media controls from briefly appearing in the wrong position.
      estimatedItemSize={999}
      data={mergedData}
      keyExtractor={mergedKeyExtractor}
      renderItem={mergedRenderItem}
      stickyHeaderIndices={[stickyIndex]}
      className="-mx-0.5 -mb-1"
      contentContainerClassName="px-4 pt-safe-offset-18"
      contentContainerStyle={{ paddingBottom: bottomOffset }}
    />
  );
}
//#endregion

//#region Header
interface HeaderProps {
  imageSource: MediaImageSrc;
  title: string;
  artists?: string[];
  metadata: string[];
  Actions: React.ReactNode;
}

export function Header(props: HeaderProps) {
  const { top } = useSafeAreaInsets();
  return (
    <View style={{ marginBottom: -top + 16 }} className="gap-6">
      <DeferredArtwork imageSource={props.imageSource} />
      <View className="flex-row items-center gap-4">
        <View className="shrink grow gap-1">
          <Marquee>
            <Text bold size="lg">
              {props.title}
            </Text>
          </Marquee>
          {props.artists ? (
            <ArtistsLink artists={props.artists} popStrategy="popTo" />
          ) : null}
          <Marquee contentContainerClassName="flex-row items-center">
            <Text muted size="xxs">
              {props.metadata.toSpliced(-1).join(" • ")}
            </Text>
            {/* Work around for RTL languages. */}
            <Text muted size="xxs">
              {" • "}
            </Text>
            <Icon name="schedule" size={12} color="onSurfaceVariant" />
            <Text muted size="xxs">
              {` ${props.metadata.at(-1)!}`}
            </Text>
          </Marquee>
        </View>
        {props.Actions}
      </View>
    </View>
  );
}

export function Controls() {
  return (
    <View className="self-end pt-safe-offset-2">
      <MediaListControls trackSource={use(TrackListContext)} />
    </View>
  );
}

//#region Artwork
function DeferredArtwork(props: { imageSource: MediaImageSrc }) {
  const { width } = useWindowDimensions();
  const isLargeScreen = useAlternativeLayout();
  // Defer rendering vinyl as it's "heavy" and causes stutters when navigating to this screen.
  const isReady = useDelayedReady(500);
  const showVinyl = use(TrackListContext).type !== "artist";

  const size = clamp(
    0,
    ((width * (isLargeScreen ? TABLET_SIDEBAR_WIDTH_RATIO : 1) - 32) * 2) / 3,
    384,
  );

  // Additional container styling.
  const horizTranslation = useSharedValue(0);
  const coverStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -horizTranslation.get() }],
  }));

  return (
    <Animated.View style={coverStyle} className="relative mx-auto">
      {isReady && showVinyl ? (
        <AnimatedVinyl
          imageSource={props.imageSource}
          size={size}
          horizTranslation={horizTranslation}
        />
      ) : null}
      <MediaImage src={props.imageSource} size={size} className="rounded-lg" />
    </Animated.View>
  );
}

function AnimatedVinyl(props: {
  imageSource: MediaImageSrc;
  size: number;
  horizTranslation: SharedValue<number>;
}) {
  const inForeground = useInForeground();
  const canAnimate = usePlaybackStore(
    (s) =>
      s.isPlaying &&
      arePlaybackSourceEqual(s.playingFrom, use(TrackListContext)),
  );

  const onMount = useCallback(() => {
    props.horizTranslation.set(withTiming(props.size / 4, { duration: 500 }));
  }, [props.horizTranslation, props.size]);

  const discStyle = useAnimatedStyle(() => ({
    // Multiplied by 2 due to also needing to account the translation of the parent.
    transform: [{ translateX: props.horizTranslation.get() * 2 }],
  }));

  return (
    <Animated.View
      onLayout={onMount}
      style={discStyle}
      className="absolute inset-0"
    >
      <Animated.View
        style={{
          animationName: {
            from: { transform: [{ rotate: "0deg" }] },
            to: { transform: [{ rotate: "360deg" }] },
          },
          animationDuration: 24000,
          animationTimingFunction: "linear",
          animationIterationCount: "infinite",
          animationPlayState: canAnimate && inForeground ? "running" : "paused",
        }}
      >
        <Vinyl source={props.imageSource} size={props.size} />
      </Animated.View>
    </Animated.View>
  );
}
//#endregion
//#endregion

//#region List
type ListProps<TData> = Pick<LegendListProps<TData>, "data"> &
  Required<Pick<LegendListProps<TData>, "keyExtractor" | "renderItem">>;

export function List<TData>(props: ListProps<TData>) {
  return <LegendList {...props} />;
}
//#endregion
