// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import React, {
  createContext,
  use,
  useCallback,
  useLayoutEffect,
  useMemo,
} from "react";
import { useWindowDimensions, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
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
import { useListLayoutConfig } from "~/hooks/useLayoutConfigs";

import { useBottomActionsOffset } from "../components/BottomActions/useBottomActions";
import { ContentPlaceholder, PagePlaceholder } from "../components/Placeholder";
import { BackButton, TopAppBarTemplate } from "../components/TopAppBar";

import { cn } from "~/lib/style";
import { clamp } from "~/utils/number";
import type { LegendListProps } from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import { ScrollView } from "~/components/Base/ScrollView";
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
    <View pointerEvents="box-none" className="absolute inset-x-0 top-safe z-10">
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
const ImageSourceContext = createContext<MediaImageSrc>(null);

export function Provider(props: {
  imageSource: MediaImageSrc;
  listSource: PlayFromSource;
  children: React.ReactNode;
}) {
  const isLargeScreen = useAlternativeLayout();
  const UsedLayout = isLargeScreen ? TabletLayout : MobileLayout;
  return (
    <TrackListContext value={props.listSource}>
      <ImageSourceContext value={props.imageSource}>
        <AtmosphereBackground source={props.imageSource}>
          <TopAppBar />
          <UsedLayout>{props.children}</UsedLayout>
        </AtmosphereBackground>
      </ImageSourceContext>
    </TrackListContext>
  );
}
//#endregion

//#region Layout Handler
function useLayoutComponents(children: React.ReactNode) {
  return useMemo(() => {
    const nodes: React.JSX.Element[] = Array.isArray(children)
      ? children
      : // `flat(1)` is to handle fragments.
        React.Children.toArray(children).flat(1);

    const header = nodes.find((n) => n.type.name === "Header");
    const list = nodes.find((n) => n.type.name === "List");

    if (!header || !list)
      throw new Error("`MediaListLayout` is missing the header or list.");

    return { header, list };
  }, [children]);
}

function useListLayoutProps() {
  const bottomOffset = useBottomActionsOffset();

  const { count } = useListLayoutConfig({
    percentDeduction: TABLET_SIDEBAR_WIDTH_RATIO,
  });
  const overrideItemLayout = useMemo(
    () => overrideItemLayoutFactory(count),
    [count],
  );

  return useMemo(
    () =>
      ({
        numColumns: count,
        estimatedItemSize: 62, // 56px Height + 6px Margin Bottom
        getItemType: getItemType,
        overrideItemLayout: overrideItemLayout,
        ListEmptyComponent: <ContentPlaceholder errMsgKey="err.msg.noTracks" />,
        className: "-mx-0.75 -mb-1.5",
        contentContainerClassName: "px-4 pt-safe-offset-18",
        contentContainerStyle: { paddingBottom: bottomOffset },
      }) satisfies Partial<LegendListProps>,
    [bottomOffset, count, overrideItemLayout],
  );
}

function MobileLayout({ children }: { children: React.ReactNode }) {
  const { top } = useSafeAreaInsets();
  const { header, list } = useLayoutComponents(children);
  const listLayoutProps = useListLayoutProps();

  const { ListHeaderComponent, ...listProps } = list.props as ListProps<any>;

  const controlsRestPosition = useSharedValue(-1);
  const controlsRef = useAnimatedRef();
  useLayoutEffect(() => {
    controlsRef.current?.measure((_x, _y, _width, _height, _pageX, pageY) => {
      controlsRestPosition?.set(pageY - top - 8);
    });
  }, [top, controlsRef, controlsRestPosition]);

  const scrollPosition = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      "worklet";
      scrollPosition.set(e.contentOffset.y);
    },
  });

  const stickyStyles = useAnimatedStyle(() => ({
    opacity: controlsRestPosition.get() === -1 ? 0 : 1,
    transform: [
      {
        translateY: Math.max(
          0,
          controlsRestPosition.get() - scrollPosition.get(),
        ),
      },
    ],
  }));

  return (
    <>
      <LegendList
        {...listProps}
        {...listLayoutProps}
        onScroll={scrollHandler}
        ListHeaderComponent={
          <View className={cn("mx-0.75 gap-6", !ListHeaderComponent && "pb-6")}>
            {header}
            <Animated.View ref={controlsRef} className="h-10 w-full" />
            {ListHeaderComponent}
          </View>
        }
      />
      <Animated.View
        pointerEvents="box-none"
        style={stickyStyles}
        className="absolute inset-x-0 top-0 items-end px-4 pt-safe-offset-2"
      >
        <MediaListControls trackSource={use(TrackListContext)} />
      </Animated.View>
    </>
  );
}

function TabletLayout({ children }: { children: React.ReactNode }) {
  const { header, list } = useLayoutComponents(children);
  const listLayoutProps = useListLayoutProps();

  const { ListHeaderComponent, ...listProps } = list.props as ListProps<any>;

  return (
    <View className="grow flex-row">
      <ScrollView
        className="relative my-auto w-full max-w-2/5 shrink-0"
        contentContainerStyle={listLayoutProps.contentContainerStyle}
        contentContainerClassName={cn(
          "gap-6 p-4",
          listLayoutProps.contentContainerClassName,
        )}
      >
        {header}
        <View className="self-end">
          <MediaListControls trackSource={use(TrackListContext)} />
        </View>
      </ScrollView>

      <LegendList
        {...listProps}
        ListHeaderComponent={
          ListHeaderComponent && (
            <View className="mx-0.75">{ListHeaderComponent}</View>
          )
        }
        {...listLayoutProps}
      />
    </View>
  );
}
//#endregion

//#region Header
interface HeaderProps {
  title: string;
  artists?: string[];
  metadata: string[];
  Actions: React.ReactNode;
}

export function Header(props: HeaderProps) {
  return (
    <View className="gap-6">
      <DeferredArtwork />
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
//#endregion

//#region Artwork Preview
function DeferredArtwork() {
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
        <AnimatedVinyl size={size} horizTranslation={horizTranslation} />
      ) : null}
      <MediaImage src={use(ImageSourceContext)} size={size} />
    </Animated.View>
  );
}

function AnimatedVinyl(props: {
  size: number;
  horizTranslation: SharedValue<number>;
}) {
  const inForeground = useInForeground();
  const listSource = use(TrackListContext);
  const canAnimate = usePlaybackStore(
    (s) => s.isPlaying && arePlaybackSourceEqual(s.playingFrom, listSource),
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
        <Vinyl src={use(ImageSourceContext)} size={props.size} />
      </Animated.View>
    </Animated.View>
  );
}
//#endregion

//#region List
type ListProps<TData> = Pick<LegendListProps<TData>, "data"> &
  Required<Pick<LegendListProps<TData>, "keyExtractor" | "renderItem">> & {
    ListHeaderComponent?: React.JSX.Element;
  };

export function List<TData>(props: ListProps<TData>) {
  return <LegendList {...props} />;
}
//#endregion

//#region Internal Helpers
function getItemType(item: any) {
  if (typeof item === "number" || typeof item === "string") return "label";
  return "row";
}

function overrideItemLayoutFactory(numColumns: number) {
  return (layout: { span?: number }, item: any) => {
    if (typeof item === "number" || typeof item === "string") {
      layout.span = numColumns;
    }
  };
}
//#endregion
