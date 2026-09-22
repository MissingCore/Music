// Copyright (C) 2024 - present, MissingCore
// SPDX-License-Identifier: AGPL-3.0-only

import type { StaticScreenProps } from "@react-navigation/native";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import React, {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BackHandler, useWindowDimensions } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, {
  FadeInLeft,
  FadeOutLeft,
  FadeOutRight,
  scrollTo,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useFolderContent } from "~/data/folder/queries";

import * as LibraryLayout from "~/navigation/layouts/LibrayLayout";
import { FoldersViewOptionsSheet } from "~/navigation/sheets/ViewOptionsSheet";
import { ContentPlaceholder } from "~/navigation/components/Placeholder";

import { OnRTL, OnRTLWorklet } from "~/lib/react";
import { cn } from "~/lib/style";
import { addTrailingSlash } from "~/utils/string";
import { useAnimatedLegendListRef } from "~/components/Base/LegendList";
import { useAnimatedScrollViewRef } from "~/components/Base/ScrollView";
import { Text } from "~/components/next/base/typography";
import { ImageListItem } from "~/components/next/composed/image-list-item";
import { TrackItem } from "~/components/next/composed/track-item";
import { Pressable } from "~/components/next/primitive/pressable";
import { useTrackListPlayingIndication } from "~/modules/media/components/Track";
import type { TrackContent } from "~/modules/media/components/Track.type";

type Props = StaticScreenProps<{ path?: string }>;

export default function Folders({
  route: {
    params: { path },
  },
}: Props) {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const listRef = useAnimatedLegendListRef();

  const [dirSegments, _setDirSegments] = useState<string[]>([]);
  /** Modified state setter that scrolls to the top of the page. */
  const setDirSegments: React.Dispatch<React.SetStateAction<string[]>> =
    useCallback(
      (value) => {
        // Make sure we start at the beginning whenever the directory segments change.
        listRef.current?.scrollToOffset({ offset: 0 });
        _setDirSegments(value);
      },
      [listRef],
    );

  //? Enable the ability to navigate to a specific folder programmatically.
  useEffect(() => {
    if (!isFocused || !path) return;
    // Exclude the `/` at the end of the path.
    setDirSegments(addTrailingSlash(path).split("/").slice(0, -1));
    // Clear search params after reading from it.
    navigation.setParams({ path: undefined });
  }, [navigation, isFocused, path, setDirSegments]);

  //? Treat each directory as part of the stack which gets popped when a back gesture is detected.
  useEffect(() => {
    if (!isFocused) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      // Pop a directory segment if we detect a back gesture/action.
      () => {
        if (dirSegments.length === 0) return false;
        setDirSegments((prev) => prev.toSpliced(-1, 1));
        return true;
      },
    );
    return () => subscription.remove();
  }, [dirSegments, isFocused, setDirSegments]);

  return (
    <LibraryLayout.Provider ref={listRef} asGrid={false}>
      <LibraryLayout.Header
        titleKey="term.folders"
        OptionsSheet={FoldersViewOptionsSheet}
        Subheader={
          <Breadcrumbs
            dirSegments={dirSegments}
            setDirSegments={setDirSegments}
          />
        }
      />
      <ScreenContents
        dirSegments={dirSegments}
        setDirSegments={setDirSegments}
      />
    </LibraryLayout.Provider>
  );
}

type DirState = {
  dirSegments: string[];
  setDirSegments: React.Dispatch<React.SetStateAction<string[]>>;
};

//#region Breadcrumbs
/** Animated scrollview supporting gestures. */
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const RemoveAnimation = OnRTL.decide(FadeOutLeft, FadeOutRight);

function Breadcrumbs({ dirSegments, setDirSegments }: DirState) {
  const breadcrumbsRef = useAnimatedScrollViewRef();
  const { width: screenWidth } = useWindowDimensions();
  const lastWidth = useSharedValue(0);
  const removedWidth = useSharedValue(0);
  const newScrollPos = useSharedValue(0);

  const onLayoutShift = (newWidth: number) => {
    // `newWidth` doesn't include the `px-4` on `<StickyActionListLayout />`
    // and in `<Animated.ScrollView />`.
    newScrollPos.set(64 + newWidth - screenWidth);
    if (newWidth < lastWidth.get()) {
      removedWidth.set(
        withSequence(
          withTiming(lastWidth.get() - newWidth, { duration: 0 }),
          withDelay(300, withTiming(0, { duration: 0 })),
        ),
      );
    }
    lastWidth.set(newWidth);
  };

  useDerivedValue(() => {
    scrollTo(
      breadcrumbsRef,
      OnRTLWorklet.decide(0, newScrollPos.get()),
      0,
      true,
    );
  });

  const offsetStyle = useAnimatedStyle(() => ({
    paddingRight: removedWidth.get(),
  }));

  return (
    <AnimatedScrollView
      ref={breadcrumbsRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-2 w-full rounded-lg bg-surfaceContainerLowest"
      contentContainerClassName="px-4"
    >
      <Animated.View
        onLayout={({ nativeEvent }) => onLayoutShift(nativeEvent.layout.width)}
        className="flex-row items-center gap-2"
      >
        {[undefined, ...dirSegments].map((dirName, idx) => (
          <Fragment key={idx}>
            {idx > 0 ? (
              <Animated.View entering={FadeInLeft} exiting={RemoveAnimation}>
                <Text className="px-1 text-xs">/</Text>
              </Animated.View>
            ) : null}
            <Animated.View entering={FadeInLeft} exiting={RemoveAnimation}>
              <Pressable
                // Pop the segments we pushed onto the stack and update
                // the path segments atom accordingly.
                onPress={() => setDirSegments((prev) => prev.toSpliced(idx))}
                // `pathSegments.length` instead of `pathSegments.length - 1`
                // due to us prepending an extra entry to denote the "Root".
                disabled={idx === dirSegments.length}
                className="min-h-12 min-w-6 items-center justify-center active:opacity-50"
              >
                <Text
                  className={cn("text-xs", {
                    "text-primary": idx === dirSegments.length,
                  })}
                >
                  {dirName ?? "Root"}
                </Text>
              </Pressable>
            </Animated.View>
          </Fragment>
        ))}
      </Animated.View>
      {/* Animated padding to allow exiting scroll animation to look nice. */}
      <Animated.View style={offsetStyle} />
    </AnimatedScrollView>
  );
}
//#endregion

//#region Screen Contents
function isTrackContent(data: unknown): data is TrackContent {
  return Object.hasOwn(data as TrackContent, "id");
}

function ScreenContents({ dirSegments, setDirSegments }: DirState) {
  const fullPath = dirSegments.join("/");
  const trackSource = useMemo(
    () => ({ type: "folder", id: `${fullPath}/` }) as const,
    [fullPath],
  );

  const { isPending, data } = useFolderContent(fullPath);
  const listData = useTrackListPlayingIndication(trackSource, data?.tracks);

  const renderedData = useMemo(
    () => [...(data?.directories ?? []), ...(listData ?? [])],
    [data, listData],
  );

  const renderItemFactory = useCallback(
    (listItemClass: string) => {
      const renderItem: LibraryLayout.MediaListRenderItem<
        (typeof renderedData)[number]
      > = ({ item }) =>
        isTrackContent(item) ? (
          <TrackItem
            {...item}
            trackSource={trackSource}
            className={listItemClass}
          />
        ) : (
          <ImageListItem
            src={{ type: "icon", value: "folder" }}
            label={item.name}
            onPress={() => setDirSegments((prev) => [...prev, item.name])}
            className={cn(listItemClass, "pr-4")}
          />
        );
      return renderItem;
    },
    [trackSource, setDirSegments],
  );

  return (
    <LibraryLayout.MediaList
      data={renderedData}
      renderItemFactory={renderItemFactory}
      ListEmptyComponent={
        <ContentPlaceholder
          isPending={isPending}
          className="absolute inset-0 pt-safe-offset-48"
        />
      }
    />
  );
}
//#endregion
