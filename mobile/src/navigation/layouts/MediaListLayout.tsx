// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import { createContext, use, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import flattenChildren from "react-keyed-flatten-children";
import { useWindowDimensions, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

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
import { CurrentListMenu } from "../components/CurrentListMenu";
import { ContentPlaceholder, PagePlaceholder } from "../components/Placeholder";

import { cn } from "~/lib/style";
import { clamp } from "~/utils/number";
import type { LegendListProps } from "~/components/Base/LegendList";
import { LegendList } from "~/components/Base/LegendList";
import { ScrollView } from "~/components/Base/ScrollView";
import { IconButton } from "~/components/next/base/button-icon";
import { Icon } from "~/components/next/base/icon";
import { Text } from "~/components/next/base/typography";
import { Marquee } from "~/components/next/blocks/marquee";
import type { MediaImageSrc } from "~/components/next/blocks/media-image";
import { MediaImage } from "~/components/next/blocks/media-image";
import {
  Toolbar as NativeToolbar,
  ToolbarScreenOffset,
} from "~/components/next/composed/toolbar";
import { TrackListContext } from "~/components/next/composed/track-item";
import { AtmosphereBackground } from "~/modules/customization/atmosphere/AtmosphereBackground";
import { ArtistsLink } from "~/modules/media/components/ArtistsLink";
import {
  PlayToggleButton,
  ShuffleButton,
} from "~/modules/media/components/MediaControls";
import { Vinyl } from "~/modules/media/components/Vinyl";

//#region Skeleton
export function Skeleton({ pending = false }) {
  return <PagePlaceholder isPending={pending} />;
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
    const nodes = flattenChildren(children) as React.JSX.Element[];

    const header = nodes.find((n) => n?.type === Header);
    const list = nodes.find((n) => n?.type === List);

    if (!header) throw new Error("`MediaListLayout` is missing the header.");
    if (!list) throw new Error("`MediaListLayout` is missing the list.");

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
        contentContainerClassName: cn("px-4", ToolbarScreenOffset),
        contentContainerStyle: { paddingBottom: bottomOffset },
      }) satisfies Partial<LegendListProps>,
    [bottomOffset, count, overrideItemLayout],
  );
}

function MobileLayout({ children }: { children: React.ReactNode }) {
  const { header, list } = useLayoutComponents(children);
  const listLayoutProps = useListLayoutProps();

  const { ListHeaderComponent, ...listProps } = list.props as ListProps<any>;

  return (
    <LegendList
      {...listProps}
      {...listLayoutProps}
      ListHeaderComponent={
        <View className={cn("mx-0.75 gap-6", !ListHeaderComponent && "pb-6")}>
          {header}
          {ListHeaderComponent}
        </View>
      }
    />
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
        contentContainerClassName={listLayoutProps.contentContainerClassName}
      >
        {header}
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

//#region Toolbar
/**
 * Should be rendered outside of `MediaListLayout.Provider`. Configures the
 * menu shown on the screen.
 */
export function Toolbar(props: React.ComponentProps<typeof CurrentListMenu>) {
  return (
    <NativeToolbar>
      <NativeToolbar.Actions>
        <NativeToolbar.Back />
      </NativeToolbar.Actions>
      <NativeToolbar.FABContainer>
        <CurrentListMenu {...props} />
      </NativeToolbar.FABContainer>
    </NativeToolbar>
  );
}
//#endregion

//#region Header
interface HeaderProps {
  title: string;
  artists?: string[];
  metadata: string[];
  favoriteConfig?: { toggled: boolean; onToggle: VoidFunction };
}

export function Header(props: HeaderProps) {
  const { t } = useTranslation();
  const listSource = use(TrackListContext);
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
      </View>
      <View className="flex-row items-center justify-center gap-4">
        <ShuffleButton />
        <PlayToggleButton
          trackSource={listSource}
          size="lg"
          className="max-w-3/10 shrink grow py-4"
        />
        {props.favoriteConfig ? (
          <IconButton
            icon={`favorite${props.favoriteConfig.toggled ? "-filled" : ""}`}
            accessibilityLabel={t(
              `term.${props.favoriteConfig.toggled ? "unF" : "f"}avorite`,
            )}
            onPress={props.favoriteConfig.onToggle}
            size="lg"
          />
        ) : (
          <View className="size-12" />
        )}
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
